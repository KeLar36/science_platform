const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Program = require("../models/Program");
const Project = require("../models/Project");
const Review = require("../models/Review");
const auditService = require("./auditService");

class SuperadminService {
  async getFullDashboardAnalytics(req = null) {
    const [projectStats] = await Project.aggregate([
      {
        $facet: {
          totalProjects: [{ $count: "count" }],
          unassignedProjects: [
            { $match: { reviewStatus: "Не призначено" } },
            { $count: "count" },
          ],
          inReviewProjects: [
            { $match: { reviewStatus: "В процесі" } },
            { $count: "count" },
          ],
          completedReviewProjects: [
            { $match: { reviewStatus: "Завершено" } },
            { $count: "count" },
          ],
          statusDistribution: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
          ],
          domainDistribution: [
            {
              $group: {
                _id: { $ifNull: ["$domain", "Не вказано"] },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $project: { domain: "$_id", count: 1, _id: 0 } },
          ],
          recentProjects: [
            { $sort: { createdAt: -1 } },
            { $limit: 6 },
            {
              $project: {
                title: 1,
                domain: 1,
                status: 1,
                reviewStatus: 1,
                createdAt: 1,
                authorId: 1,
              },
            },
          ],
        },
      },
    ]);

    const [reviewStats] = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$totalScore" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const [programStats] = await Program.aggregate([
      {
        $facet: {
          activePrograms: [{ $match: { active: true } }, { $count: "count" }],
          typesDistribution: [
            { $group: { _id: "$type", value: { $sum: 1 } } },
            { $project: { name: "$_id", value: 1, _id: 0 } },
          ],
        },
      },
    ]);

    const [userStats, orgStats, orgPending, orgApproved, orgCities] =
      await Promise.all([
        User.aggregate([
          {
            $facet: {
              totalUsers: [
                { $match: { isAnonymized: false } },
                { $count: "count" },
              ],
              bannedUsers: [
                { $match: { isBanned: true, isAnonymized: false } },
                { $count: "count" },
              ],
              rolesDistribution: [
                { $match: { isAnonymized: false } },
                { $group: { _id: "$role", count: { $sum: 1 } } },
                { $project: { role: "$_id", count: 1, _id: 0 } },
              ],
              activeReviewers: [
                {
                  $match: {
                    role: "reviewer",
                    isReviewerActive: true,
                    isBanned: false,
                  },
                },
                { $count: "count" },
              ],
            },
          },
        ]),
        Organization.aggregate([
          {
            $facet: {
              typesDistribution: [
                { $group: { _id: "$type", count: { $sum: 1 } } },
                { $project: { type: "$_id", count: 1, _id: 0 } },
              ],
              verifiedCount: [
                { $match: { isVerified: true } },
                { $count: "count" },
              ],
            },
          },
        ]),
        Organization.countDocuments({ status: "pending" }),
        Organization.countDocuments({ status: "approved" }),
        Organization.aggregate([
          { $group: { _id: "$city", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { city: "$_id", count: 1, _id: 0 } },
        ]),
      ]);

    const recentProjects = await Project.populate(
      projectStats?.recentProjects || [],
      { path: "authorId", select: "name email" },
    );

    await auditService.log({
      req,
      action: "SUPERADMIN_ANALYTICS_VIEWED",
      category: "SYSTEM",
      severity: "info",
      targetEntity: {
        entityType: "System",
        entityId: null,
        entityName: "Global Dashboard Analytics",
      },
      payload: {
        metadata: {
          totalUsers: userStats[0]?.totalUsers[0]?.count || 0,
          totalProjects: projectStats?.totalProjects[0]?.count || 0,
          pendingOrganizations: orgPending || 0,
        },
      },
    });

    return {
      kpis: {
        totalUsers: userStats[0]?.totalUsers[0]?.count || 0,
        bannedUsers: userStats[0]?.bannedUsers[0]?.count || 0,
        activeReviewers: userStats[0]?.activeReviewers[0]?.count || 0,
        pendingOrganizations: orgPending || 0,
        approvedOrganizations: orgApproved || 0,
        verifiedOrganizations: orgStats[0]?.verifiedCount[0]?.count || 0,
        activePrograms: programStats?.activePrograms[0]?.count || 0,
        totalProjects: projectStats?.totalProjects[0]?.count || 0,
        unassignedProjects: projectStats?.unassignedProjects[0]?.count || 0,
        inReviewProjects: projectStats?.inReviewProjects[0]?.count || 0,
        completedReviewProjects:
          projectStats?.completedReviewProjects[0]?.count || 0,
        avgReviewScore: reviewStats?.avgScore
          ? Number(reviewStats.avgScore.toFixed(2))
          : 0,
        totalReviews: reviewStats?.totalReviews || 0,
      },
      distributions: {
        domains: projectStats?.domainDistribution || [],
        programTypes: programStats?.typesDistribution || [],
        projectStatuses: projectStats?.statusDistribution || [],
        userRoles: userStats[0]?.rolesDistribution || [],
        organizationTypes: orgStats[0]?.typesDistribution || [],
        topCities: orgCities || [],
      },
      recentProjects,
    };
  }

  async getProgramsList(filters = {}, req = null) {
    const { page = 1, limit = 8, search = "", active, type } = filters;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 8);
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (active !== undefined && active !== "all") {
      query.active = active === true || active === "true";
    }

    if (type && type !== "Всі") {
      query.type = type;
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const [programs, total] = await Promise.all([
      Program.find(query)
        .populate("organizationId", "name logo isSystem")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Program.countDocuments(query),
    ]);

    return {
      programs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalItems: total,
      },
    };
  }
}

module.exports = new SuperadminService();

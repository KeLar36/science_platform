const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Program = require("../models/Program");
const Project = require("../models/Project");

class SuperadminService {
  async getFullDashboardAnalytics() {
    const [projectStats] = await Project.aggregate([
      {
        $facet: {
          totalProjects: [{ $count: "count" }],
          unassignedProjects: [
            { $match: { reviewStatus: "Не призначено" } },
            { $count: "count" },
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
            { $limit: 5 },
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

    const [userStats, orgPending, orgApproved] = await Promise.all([
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
          },
        },
      ]),
      Organization.countDocuments({ status: "pending" }),
      Organization.countDocuments({ status: "approved" }),
    ]);

    const recentProjects = await Project.populate(
      projectStats?.recentProjects || [],
      { path: "authorId", select: "name email" },
    );

    return {
      kpis: {
        totalUsers: userStats[0]?.totalUsers[0]?.count || 0,
        bannedUsers: userStats[0]?.bannedUsers[0]?.count || 0,
        pendingOrganizations: orgPending || 0,
        approvedOrganizations: orgApproved || 0,
        activePrograms: programStats?.activePrograms[0]?.count || 0,
        totalProjects: projectStats?.totalProjects[0]?.count || 0,
        unassignedProjects: projectStats?.unassignedProjects[0]?.count || 0,
      },
      domainDistribution: projectStats?.domainDistribution || [],
      programTypesDistribution: programStats?.typesDistribution || [],
      recentProjects,
    };
  }

  async getProgramsList(filters = {}) {
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

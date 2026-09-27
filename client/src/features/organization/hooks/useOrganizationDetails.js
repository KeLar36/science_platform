import { useState, useCallback } from "react";
import { organizationApi } from "@/features/organization/api/organizationApi";
import { programApi } from "@/features/programs/api/programApi";
import { projectApi } from "@/features/projects/api/projectApi";
import { postApi } from "@/features/blog/api/postApi";

export function useOrganizationDetails(orgId) {
  const [orgData, setOrgData] = useState(null);

  const [programs, setPrograms] = useState([]);
  const [programsPagination, setProgramsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  const [projects, setProjects] = useState([]);
  const [projectsPagination, setProjectsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  const [posts, setPosts] = useState([]);
  const [postsPagination, setPostsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchOrgDetails = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoadingOrg(true);
      const data = await organizationApi.getById(orgId);
      setOrgData(data);
    } catch (err) {
      console.error("Помилка завантаження організації:", err);
    } finally {
      setLoadingOrg(false);
    }
  }, [orgId]);

  // useOrganizationDetails.js

  const fetchPrograms = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      try {
        setLoadingPrograms(true);
        const res = await programApi.getByOrganization(orgId, page); //[cite: 13]
        const allPrograms = res.items || res.programs || res || [];

        const activePrograms = allPrograms.filter((prog) => {
          if (!prog.deadline && !prog.deadlineDate && !prog.endDate)
            return true;
          const d = new Date(
            prog.deadline || prog.deadlineDate || prog.endDate,
          );
          return d >= new Date();
        });

        setPrograms(activePrograms);
        setProgramsPagination({
          currentPage: res.currentPage || page,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error("Помилка завантаження програм:", err);
      } finally {
        setLoadingPrograms(false);
      }
    },
    [orgId],
  );

  const fetchProjects = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      try {
        setLoadingProjects(true);
        const res = await projectApi.getOrganizationProjects(
          orgId,
          { status: "Прийнято" },
          page,
          8,
        );
        setProjects(res.projects || []);
        setProjectsPagination({
          currentPage: res.currentPage || page,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error("Помилка завантаження проєктів:", err);
      } finally {
        setLoadingProjects(false);
      }
    },
    [orgId],
  );

  const fetchPosts = useCallback(
    async (page = 1) => {
      if (!orgId) return;
      try {
        setLoadingPosts(true);
        const res = await postApi.getAll(
          { organizationId: orgId, status: "published" },
          page,
        );
        setPosts(res.posts || res.items || []);
        setPostsPagination({
          currentPage: res.currentPage || page,
          totalPages: res.totalPages || 1,
        });
      } catch (err) {
        console.error("Помилка завантаження постів:", err);
      } finally {
        setLoadingPosts(false);
      }
    },
    [orgId],
  );

  return {
    orgData,
    programs,
    programsPagination,
    projects,
    projectsPagination,
    posts,
    postsPagination,
    loadingOrg,
    loadingPrograms,
    loadingProjects,
    loadingPosts,
    fetchOrgDetails,
    fetchPrograms,
    fetchProjects,
    fetchPosts,
  };
}

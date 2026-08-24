import { Calendar, User, Building2, Eye, MessageSquare } from "lucide-react";
import Badge from "@/shared/ui/Badge";
import Avatar from "@/shared/ui/Avatar";
import Slider from "@/shared/ui/Slider";

export default function PostHeader({ post }) {
  if (!post) return null;

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const postImages =
    Array.isArray(post.images) && post.images.length > 0
      ? post.images
      : post.coverImage
        ? [{ url: post.coverImage }]
        : [];

  return (
    <header className="space-y-6 text-left max-w-4xl mx-auto w-full">
      <div className="flex flex-wrap items-center gap-2">
        <Badge status="success">{post.category}</Badge>

        {post.organizationId ? (
          <Badge status="default" className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-brand" />
            <span>{post.organizationId.name}</span>
          </Badge>
        ) : (
          <Badge status="default">Загальний матеріал</Badge>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary leading-tight">
        {post.title}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-border-color/60 text-xs text-text-secondary">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={post.authorId?.image}
            name={post.authorId?.Name || "Автор"}
            size="md"
          />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-text-primary">
              {post.authorId?.name || "Науковець"}
            </span>
            <span className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-mono">
              {post.authorId?.role || "Користувач"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {post.commentsCount || 0} коментарів
          </span>
        </div>
      </div>

      {postImages.length > 0 && <Slider images={postImages} className="mt-4" />}
    </header>
  );
}

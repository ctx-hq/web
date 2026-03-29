import type { FC } from "hono/jsx";
import type { OrgMember } from "../lib/types";
import { Badge } from "./badge";

function avatarUrl(username: string, size: number = 40): string {
  return `https://source.boringavatars.com/beam/${size}/${encodeURIComponent(username)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

export const OrgMembers: FC<{ members: OrgMember[] | null }> = ({ members }) => {
  if (members === null) {
    return <p class="text-xs text-muted-foreground">Sign in to view members.</p>;
  }
  if (members.length === 0) {
    return <p class="text-xs text-muted-foreground">No members.</p>;
  }

  return (
    <ul class="space-y-2" aria-label="Organization members">
      {members.map((member) => (
        <li class="flex items-center gap-3 text-xs">
          <div class="relative size-6 shrink-0">
            <div class="absolute inset-0 flex items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium text-muted-foreground">
              {member.username[0]?.toUpperCase()}
            </div>
            <img
              src={member.avatar_url || avatarUrl(member.username, 24)}
              alt=""
              class="relative size-6 rounded-full border border-border bg-muted"
              loading="lazy"
            />
          </div>
          <span class="font-medium">{member.username}</span>
          <Badge variant={member.role === "owner" ? "default" : "secondary"}>
            {member.role}
          </Badge>
        </li>
      ))}
    </ul>
  );
};

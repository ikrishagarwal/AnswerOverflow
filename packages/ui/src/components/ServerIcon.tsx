import type { ServerPublic } from "@answeroverflow/api";
import { Avatar, AvatarProps, getAvatarSize } from "./primitives/Avatar";

export interface ServerIconProps extends Omit<AvatarProps, "url" | "alt"> {
  server: ServerPublic;
}

export const makeServerIconLink = (server: ServerPublic, size: number = 64) => {
  if (!server.icon) return undefined;
  return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=${size}`;
};

export function ServerIcon({ server, size = "md", ...props }: ServerIconProps) {
  const server_icon_url = makeServerIconLink(server, getAvatarSize(size));
  return <Avatar url={server_icon_url} alt={server.name} size={size} {...props} />;
}

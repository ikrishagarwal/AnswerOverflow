import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { Events, GuildMember } from "discord.js";
import { findServerSettingsById } from "@answeroverflow/db";
import { createMemberCtx } from "~discord-bot/utils/context";
import { toAODiscordAccount } from "~discord-bot/utils/conversions";
import { callApiWithConsoleStatusHandler } from "~discord-bot/utils/trpc";

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberUpdate })
export class ReadTheRulesConsent extends Listener {
  public async run(oldMember: GuildMember, newMember: GuildMember) {
    if (oldMember.pending && !newMember.pending) {
      const server_settings = await findServerSettingsById(newMember.guild.id);

      if (!server_settings?.flags.read_the_rules_consent_enabled) {
        return;
      }
      await callApiWithConsoleStatusHandler({
        async ApiCall(router) {
          const user = toAODiscordAccount(newMember.user);
          return router.user_server_settings.upsertWithDeps({
            user,
            server_id: oldMember.guild.id,
            flags: {
              can_publicly_display_messages: true,
            },
          });
        },
        error_message: `Failed to update user ${newMember.id} in server ${newMember.guild.id} to have read the rules consent.`,
        success_message: `Updated user ${newMember.id} in server ${newMember.guild.id} to have read the rules consent.`,
        getCtx: () => createMemberCtx(newMember),
      });
    }
  }
}

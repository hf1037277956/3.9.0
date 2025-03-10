import { inject, injectAll, injectable } from "tsyringe";

import { IDialogueChatBot } from "@spt/helpers/Dialogue/IDialogueChatBot";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";
import { IFriendRequestSendResponse } from "@spt/models/eft/dialog/IFriendRequestSendResponse";
import { IGetFriendListDataResponse } from "@spt/models/eft/dialog/IGetFriendListDataResponse";
import { BackendErrorCodes } from "@spt/models/enums/BackendErrorCodes";
import { ICoreConfig } from "@spt/models/spt/config/ICoreConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ConfigServer } from "@spt/servers/ConfigServer";

import { FikaFriendRequestsHelper } from "../helpers/FikaFriendRequestsHelper";
import { FikaPlayerRelationsHelper } from "../helpers/FikaPlayerRelationsHelper";
import { IFriendRequestListResponse } from "../models/eft/dialog/IFriendRequestListResponse";

@injectable()
export class FikaDialogueController {
    constructor(
        @injectAll("DialogueChatBot") protected dialogueChatBots: IDialogueChatBot[],
        @inject("ProfileHelper") protected profileHelper: ProfileHelper,
        @inject("ConfigServer") protected configServer: ConfigServer,
        @inject("FikaFriendRequestsHelper") protected fikaFriendRequestsHelper: FikaFriendRequestsHelper,
        @inject("FikaPlayerRelationsHelper") protected fikaPlayerRelationsHelper: FikaPlayerRelationsHelper,
    ) {
        // empty
    }

    public getFriendList(sessionID: string): IGetFriendListDataResponse {
        const core = this.configServer.getConfig<ICoreConfig>(ConfigTypes.CORE);
        let botsAndFriends = this.dialogueChatBots.map((v) => v.getChatBot());
        if (!core.features.chatbotFeatures.commandoEnabled) {
            botsAndFriends = botsAndFriends.filter(u => u._id != "sptCommando");
        }

        if (!core.features.chatbotFeatures.sptFriendEnabled) {
            botsAndFriends = botsAndFriends.filter(u => u._id != "sptFriend");
        }

        const friendsIds = this.fikaPlayerRelationsHelper.getFriendsList(sessionID);

        for (const friendId of friendsIds) {
            const profile = this.profileHelper.getPmcProfile(friendId);

            botsAndFriends.push({
                _id: profile._id,
                aid: profile.aid,
                Info: {
                    Nickname: profile.Info.Nickname,
                    Level: profile.Info.Level,
                    Side: profile.Info.Side,
                    MemberCategory: profile.Info.MemberCategory,
                },
            });
        }

        return {
            Friends: botsAndFriends,
            Ignore: this.fikaPlayerRelationsHelper.getIgnoreList(sessionID),
            InIgnoreList: this.fikaPlayerRelationsHelper.getInIgnoreList(sessionID),
        };
    }

    public listOutbox(sessionID: string): IFriendRequestListResponse[] {
        const sentFriendRequests = this.fikaFriendRequestsHelper.getSentFriendRequests(sessionID) as IFriendRequestListResponse[];

        for (const sentFriendRequest of sentFriendRequests) {
            const profile = this.profileHelper.getPmcProfile(sentFriendRequest.to);

            sentFriendRequest.profile = {
                _id: profile._id,
                aid: profile.aid,
                Info: {
                    Nickname: profile.Info.Nickname,
                    Side: profile.Info.Side,
                    Level: profile.Info.Level,
                    MemberCategory: profile.Info.MemberCategory,
                },
            };
        }

        return sentFriendRequests;
    }

    public listInbox(sessionID: string): IFriendRequestListResponse[] {
        const receivedFriendRequests = this.fikaFriendRequestsHelper.getReceivedFriendRequests(sessionID) as IFriendRequestListResponse[];

        for (const receivedFriendRequest of receivedFriendRequests) {
            const profile = this.profileHelper.getPmcProfile(receivedFriendRequest.from);

            receivedFriendRequest.profile = {
                _id: profile._id,
                aid: profile.aid,
                Info: {
                    Nickname: profile.Info.Nickname,
                    Side: profile.Info.Side,
                    Level: profile.Info.Level,
                    MemberCategory: profile.Info.MemberCategory,
                },
            };
        }

        return receivedFriendRequests;
    }

    public sendFriendRequest(from: string, to: string): IFriendRequestSendResponse {
        this.fikaFriendRequestsHelper.addFriendRequest(from, to);

        return {
            status: BackendErrorCodes.NONE,
            requestId: from,
            retryAfter: 0,
        };
    }

    public acceptAllFriendRequests(sessionID: string): void {
        const receivedFriendRequests = this.fikaFriendRequestsHelper.getReceivedFriendRequests(sessionID);

        for (const friendRequest of receivedFriendRequests) {
            this.acceptFriendRequest(friendRequest.from, friendRequest.to);
        }
    }

    public acceptFriendRequest(from: string, to: string): void {
        this.fikaFriendRequestsHelper.removeFriendRequest(from, to);

        this.fikaPlayerRelationsHelper.addFriend(from, to);
    }

    public cancelFriendRequest(from: string, to: string): void {
        this.fikaFriendRequestsHelper.removeFriendRequest(from, to);
    }

    public declineFriendRequest(from: string, to: string): void {
        this.cancelFriendRequest(from, to);
    }

    public deleteFriend(fromId: string, friendId: string): void {
        this.fikaPlayerRelationsHelper.removeFriend(fromId, friendId);
    }

    public ignoreFriend(fromId: string, friendId: string): void {
        this.fikaPlayerRelationsHelper.addToIgnoreList(fromId, friendId);
    }

    public unIgnoreFriend(fromId: string, friendId: string): void {
        this.fikaPlayerRelationsHelper.removeFromIgnoreList(fromId, friendId);
    }
}

import {
  Form,
  json,
  LinksFunction,
  LoaderFunction,
  useLoaderData,
} from "remix";
import invariant from "tiny-invariant";
import { Button } from "~/components/Button";
import { DISCORD_URL } from "~/constants";
import * as LFGMatch from "~/models/LFGMatch.server";
import { getUser, UserLean } from "~/utils";
import styles from "~/styles/play-match.css";
import { Avatar } from "~/components/Avatar";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

interface LFGMatchLoaderData {
  /** Can the user counterpick and report scores? */
  isCaptain: boolean;
  isRanked: boolean;
  groups: UserLean[][];
}

export const loader: LoaderFunction = async ({ params, context }) => {
  invariant(typeof params.id === "string", "Expected params.bid to be string");
  const user = getUser(context);

  const match = await LFGMatch.findById(params.id);
  if (!match) return new Response(null, { status: 404 });

  //const isRanked = match.groups.every((g) => g.ranked);
  const isRanked = false;
  const isOwnMatch = match.groups.some((g) =>
    g.members.some((m) => user?.id === m.user.id)
  );
  // Non-ranked matches are only of interest to participants
  if (!isRanked && !isOwnMatch) {
    return new Response(null, { status: 404 });
  }

  const isCaptain = match.groups.some((g) =>
    g.members.some((m) => m.user.id === user?.id && m.captain)
  );
  return json<LFGMatchLoaderData>({
    isCaptain,
    isRanked,
    groups: match.groups
      .sort((a, b) => {
        const aIsOwnGroup = a.members.some((m) => user?.id === m.user.id);
        const bIsOwnGroup = b.members.some((m) => user?.id === m.user.id);

        return Number(bIsOwnGroup) - Number(aIsOwnGroup);
      })
      .map((g) => {
        return g.members.map((g) => ({
          id: g.user.id,
          discordId: g.user.discordId,
          discordAvatar: g.user.discordAvatar,
          discordName: g.user.discordName,
          discordDiscriminator: g.user.discordDiscriminator,
        }));
      }),
  });
};

export default function LFGMatchPage() {
  const data = useLoaderData<LFGMatchLoaderData>();

  return (
    <div className="container">
      <div className="play-match__waves">
        <div className="play-match__teams">
          {data.groups.map((g, i) => {
            return (
              <div
                key={i}
                className="play-match__waves-section play-match__players"
              >
                {g.map((user) => (
                  <div key={user.id} className="play-match__player">
                    <Avatar user={user} />
                    <span className="play-match__player-name">
                      {user.discordName}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {!data.isRanked && (
          <div className="play-match__waves-section play-match__info">
            This is your match! You can reach out to your opponents{" "}
            <a href={DISCORD_URL}>our Discord</a> in the{" "}
            <code>#match-meetup</code> channel.
          </div>
        )}
      </div>
      <div className="play-match__waves-button">
        <Form method="post">
          {data.isCaptain && (
            <Button
              type="submit"
              name="_action"
              value="LOOK_AGAIN"
              tiny
              variant="outlined"
            >
              Look again
            </Button>
          )}
        </Form>
      </div>
    </div>
  );
}
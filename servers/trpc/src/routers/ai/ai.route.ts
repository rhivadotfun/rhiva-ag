import { router } from "../../trpc";
import { threadRoute } from "./threads/thread.route";
import { messageRoute } from "./messages/message.route";

export const aiRoute = router({
  message: messageRoute,
  thread: threadRoute,
});

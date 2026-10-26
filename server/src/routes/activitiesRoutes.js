import { Router } from "express";
import { sendFailure } from "./httpResult.js";

// Thin routes: read the request, call the service, translate its result.
export function createActivitiesRouter(activityService) {
  const router = Router();

  // 001/RF-1.1, 001/RF-5.1, 001/RF-5.2, 001/RF-6.1, 001/RF-6.3, 001/RF-7.4
  router.get("/activities", async (req, res) => {
    const result = await activityService.listActivities();
    if (!result.ok) return sendFailure(res, result);
    return res.status(200).json({ activities: result.activities });
  });

  return router;
}

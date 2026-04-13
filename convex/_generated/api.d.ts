/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analysis from "../analysis.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as biomarkers from "../biomarkers.js";
import type * as checkins from "../checkins.js";
import type * as consent from "../consent.js";
import type * as deleteAccount from "../deleteAccount.js";
import type * as genetics from "../genetics.js";
import type * as healthPlans from "../healthPlans.js";
import type * as http from "../http.js";
import type * as profiles from "../profiles.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analysis: typeof analysis;
  audit: typeof audit;
  auth: typeof auth;
  biomarkers: typeof biomarkers;
  checkins: typeof checkins;
  consent: typeof consent;
  deleteAccount: typeof deleteAccount;
  genetics: typeof genetics;
  healthPlans: typeof healthPlans;
  http: typeof http;
  profiles: typeof profiles;
  uploads: typeof uploads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

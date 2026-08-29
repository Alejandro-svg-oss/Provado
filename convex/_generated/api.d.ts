/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as apifySearch from "../apifySearch.js";
import type * as deepseek from "../deepseek.js";
import type * as evidenceSearch from "../evidenceSearch.js";
import type * as queryDistillation from "../queryDistillation.js";
import type * as search from "../search.js";
import type * as validations from "../validations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  apifySearch: typeof apifySearch;
  deepseek: typeof deepseek;
  evidenceSearch: typeof evidenceSearch;
  queryDistillation: typeof queryDistillation;
  search: typeof search;
  validations: typeof validations;
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

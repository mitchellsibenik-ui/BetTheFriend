"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/chat/unread/route";
exports.ids = ["app/api/chat/unread/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fchat%2Funread%2Froute&page=%2Fapi%2Fchat%2Funread%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Funread%2Froute.ts&appDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fchat%2Funread%2Froute&page=%2Fapi%2Fchat%2Funread%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Funread%2Froute.ts&appDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   headerHooks: () => (/* binding */ headerHooks),\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),\n/* harmony export */   staticGenerationBailout: () => (/* binding */ staticGenerationBailout)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_mitchellsibenik_Desktop_BetTheFriend_src_app_api_chat_unread_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/chat/unread/route.ts */ \"(rsc)/./src/app/api/chat/unread/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/chat/unread/route\",\n        pathname: \"/api/chat/unread\",\n        filename: \"route\",\n        bundlePath: \"app/api/chat/unread/route\"\n    },\n    resolvedPagePath: \"/Users/mitchellsibenik/Desktop/BetTheFriend/src/app/api/chat/unread/route.ts\",\n    nextConfigOutput,\n    userland: _Users_mitchellsibenik_Desktop_BetTheFriend_src_app_api_chat_unread_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks, headerHooks, staticGenerationBailout } = routeModule;\nconst originalPathname = \"/api/chat/unread/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZjaGF0JTJGdW5yZWFkJTJGcm91dGUmcGFnZT0lMkZhcGklMkZjaGF0JTJGdW5yZWFkJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGY2hhdCUyRnVucmVhZCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm1pdGNoZWxsc2liZW5payUyRkRlc2t0b3AlMkZCZXRUaGVGcmllbmQlMkZzcmMlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGbWl0Y2hlbGxzaWJlbmlrJTJGRGVza3RvcCUyRkJldFRoZUZyaWVuZCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDNEI7QUFDekc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSx1R0FBdUc7QUFDL0c7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUM2Sjs7QUFFN0oiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iZXQtdGhlLWZyaWVuZC8/ZWEyZSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvbWl0Y2hlbGxzaWJlbmlrL0Rlc2t0b3AvQmV0VGhlRnJpZW5kL3NyYy9hcHAvYXBpL2NoYXQvdW5yZWFkL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcInN0YW5kYWxvbmVcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvY2hhdC91bnJlYWQvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9jaGF0L3VucmVhZFwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvY2hhdC91bnJlYWQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvbWl0Y2hlbGxzaWJlbmlrL0Rlc2t0b3AvQmV0VGhlRnJpZW5kL3NyYy9hcHAvYXBpL2NoYXQvdW5yZWFkL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIGhlYWRlckhvb2tzLCBzdGF0aWNHZW5lcmF0aW9uQmFpbG91dCB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2NoYXQvdW5yZWFkL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIGhlYWRlckhvb2tzLCBzdGF0aWNHZW5lcmF0aW9uQmFpbG91dCwgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fchat%2Funread%2Froute&page=%2Fapi%2Fchat%2Funread%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Funread%2Froute.ts&appDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/chat/unread/route.ts":
/*!******************************************!*\
  !*** ./src/app/api/chat/unread/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/web/exports/next-response */ \"(rsc)/./node_modules/next/dist/server/web/exports/next-response.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\n\n// GET /api/chat/unread - Get unread message counts for all chat rooms\nasync function GET(request) {\n    try {\n        const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n        if (!session?.user?.id) {\n            return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        // Get all chat rooms for the user\n        const chatRooms = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.chatRoom.findMany({\n            where: {\n                OR: [\n                    {\n                        user1Id: session.user.id\n                    },\n                    {\n                        user2Id: session.user.id\n                    }\n                ]\n            },\n            include: {\n                messages: {\n                    where: {\n                        senderId: {\n                            not: session.user.id\n                        },\n                        readStatus: {\n                            none: {\n                                userId: session.user.id\n                            }\n                        }\n                    },\n                    include: {\n                        sender: {\n                            select: {\n                                id: true,\n                                username: true\n                            }\n                        }\n                    },\n                    orderBy: {\n                        createdAt: \"desc\"\n                    },\n                    take: 1 // Get the latest unread message for each room\n                }\n            }\n        });\n        // Format the response\n        const unreadData = chatRooms.filter((room)=>room.messages.length > 0).map((room)=>({\n                roomId: room.id,\n                unreadCount: room.messages.length,\n                latestMessage: room.messages[0],\n                otherUser: room.user1Id === session.user.id ? {\n                    id: room.user2Id,\n                    username: room.user2?.username\n                } : {\n                    id: room.user1Id,\n                    username: room.user1?.username\n                }\n            }));\n        return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json({\n            unreadMessages: unreadData\n        });\n    } catch (error) {\n        console.error(\"Error fetching unread messages:\", error);\n        return next_dist_server_web_exports_next_response__WEBPACK_IMPORTED_MODULE_0__[\"default\"].json({\n            error: \"Internal server error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9jaGF0L3VucmVhZC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBdUQ7QUFDWDtBQUNKO0FBQ0g7QUFFckMsc0VBQXNFO0FBQy9ELGVBQWVJLElBQUlDLE9BQW9CO0lBQzVDLElBQUk7UUFDRixNQUFNQyxVQUFVLE1BQU1MLDJEQUFnQkEsQ0FBQ0Msa0RBQVdBO1FBQ2xELElBQUksQ0FBQ0ksU0FBU0MsTUFBTUMsSUFBSTtZQUN0QixPQUFPUixrRkFBWUEsQ0FBQ1MsSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQWUsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ3BFO1FBRUEsa0NBQWtDO1FBQ2xDLE1BQU1DLFlBQVksTUFBTVQsK0NBQU1BLENBQUNVLFFBQVEsQ0FBQ0MsUUFBUSxDQUFDO1lBQy9DQyxPQUFPO2dCQUNMQyxJQUFJO29CQUNGO3dCQUFFQyxTQUFTWCxRQUFRQyxJQUFJLENBQUNDLEVBQUU7b0JBQUM7b0JBQzNCO3dCQUFFVSxTQUFTWixRQUFRQyxJQUFJLENBQUNDLEVBQUU7b0JBQUM7aUJBQzVCO1lBQ0g7WUFDQVcsU0FBUztnQkFDUEMsVUFBVTtvQkFDUkwsT0FBTzt3QkFDTE0sVUFBVTs0QkFBRUMsS0FBS2hCLFFBQVFDLElBQUksQ0FBQ0MsRUFBRTt3QkFBQzt3QkFDakNlLFlBQVk7NEJBQ1ZDLE1BQU07Z0NBQ0pDLFFBQVFuQixRQUFRQyxJQUFJLENBQUNDLEVBQUU7NEJBQ3pCO3dCQUNGO29CQUNGO29CQUNBVyxTQUFTO3dCQUNQTyxRQUFROzRCQUNOQyxRQUFRO2dDQUFFbkIsSUFBSTtnQ0FBTW9CLFVBQVU7NEJBQUs7d0JBQ3JDO29CQUNGO29CQUNBQyxTQUFTO3dCQUFFQyxXQUFXO29CQUFPO29CQUM3QkMsTUFBTSxFQUFFLDhDQUE4QztnQkFDeEQ7WUFDRjtRQUNGO1FBRUEsc0JBQXNCO1FBQ3RCLE1BQU1DLGFBQWFwQixVQUNoQnFCLE1BQU0sQ0FBQ0MsQ0FBQUEsT0FBUUEsS0FBS2QsUUFBUSxDQUFDZSxNQUFNLEdBQUcsR0FDdENDLEdBQUcsQ0FBQ0YsQ0FBQUEsT0FBUztnQkFDWkcsUUFBUUgsS0FBSzFCLEVBQUU7Z0JBQ2Y4QixhQUFhSixLQUFLZCxRQUFRLENBQUNlLE1BQU07Z0JBQ2pDSSxlQUFlTCxLQUFLZCxRQUFRLENBQUMsRUFBRTtnQkFDL0JvQixXQUFXTixLQUFLakIsT0FBTyxLQUFLWCxRQUFRQyxJQUFJLENBQUNDLEVBQUUsR0FDdkM7b0JBQUVBLElBQUkwQixLQUFLaEIsT0FBTztvQkFBRVUsVUFBVU0sS0FBS08sS0FBSyxFQUFFYjtnQkFBUyxJQUNuRDtvQkFBRXBCLElBQUkwQixLQUFLakIsT0FBTztvQkFBRVcsVUFBVU0sS0FBS1EsS0FBSyxFQUFFZDtnQkFBUztZQUN6RDtRQUVGLE9BQU81QixrRkFBWUEsQ0FBQ1MsSUFBSSxDQUFDO1lBQUVrQyxnQkFBZ0JYO1FBQVc7SUFDeEQsRUFBRSxPQUFPdEIsT0FBTztRQUNka0MsUUFBUWxDLEtBQUssQ0FBQyxtQ0FBbUNBO1FBQ2pELE9BQU9WLGtGQUFZQSxDQUFDUyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUF3QixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM3RTtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmV0LXRoZS1mcmllbmQvLi9zcmMvYXBwL2FwaS9jaGF0L3VucmVhZC9yb3V0ZS50cz82NWI0Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcidcbmltcG9ydCB7IGdldFNlcnZlclNlc3Npb24gfSBmcm9tICduZXh0LWF1dGgnXG5pbXBvcnQgeyBhdXRoT3B0aW9ucyB9IGZyb20gJ0AvbGliL2F1dGgnXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tICdAL2xpYi9wcmlzbWEnXG5cbi8vIEdFVCAvYXBpL2NoYXQvdW5yZWFkIC0gR2V0IHVucmVhZCBtZXNzYWdlIGNvdW50cyBmb3IgYWxsIGNoYXQgcm9vbXNcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2VydmVyU2Vzc2lvbihhdXRoT3B0aW9ucylcbiAgICBpZiAoIXNlc3Npb24/LnVzZXI/LmlkKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSwgeyBzdGF0dXM6IDQwMSB9KVxuICAgIH1cblxuICAgIC8vIEdldCBhbGwgY2hhdCByb29tcyBmb3IgdGhlIHVzZXJcbiAgICBjb25zdCBjaGF0Um9vbXMgPSBhd2FpdCBwcmlzbWEuY2hhdFJvb20uZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgT1I6IFtcbiAgICAgICAgICB7IHVzZXIxSWQ6IHNlc3Npb24udXNlci5pZCB9LFxuICAgICAgICAgIHsgdXNlcjJJZDogc2Vzc2lvbi51c2VyLmlkIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgbWVzc2FnZXM6IHtcbiAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgc2VuZGVySWQ6IHsgbm90OiBzZXNzaW9uLnVzZXIuaWQgfSwgLy8gT25seSBtZXNzYWdlcyBmcm9tIG90aGVyIHVzZXJzXG4gICAgICAgICAgICByZWFkU3RhdHVzOiB7XG4gICAgICAgICAgICAgIG5vbmU6IHtcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHNlc3Npb24udXNlci5pZFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICBzZW5kZXI6IHtcbiAgICAgICAgICAgICAgc2VsZWN0OiB7IGlkOiB0cnVlLCB1c2VybmFtZTogdHJ1ZSB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2Rlc2MnIH0sXG4gICAgICAgICAgdGFrZTogMSAvLyBHZXQgdGhlIGxhdGVzdCB1bnJlYWQgbWVzc2FnZSBmb3IgZWFjaCByb29tXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gRm9ybWF0IHRoZSByZXNwb25zZVxuICAgIGNvbnN0IHVucmVhZERhdGEgPSBjaGF0Um9vbXNcbiAgICAgIC5maWx0ZXIocm9vbSA9PiByb29tLm1lc3NhZ2VzLmxlbmd0aCA+IDApXG4gICAgICAubWFwKHJvb20gPT4gKHtcbiAgICAgICAgcm9vbUlkOiByb29tLmlkLFxuICAgICAgICB1bnJlYWRDb3VudDogcm9vbS5tZXNzYWdlcy5sZW5ndGgsXG4gICAgICAgIGxhdGVzdE1lc3NhZ2U6IHJvb20ubWVzc2FnZXNbMF0sXG4gICAgICAgIG90aGVyVXNlcjogcm9vbS51c2VyMUlkID09PSBzZXNzaW9uLnVzZXIuaWQgXG4gICAgICAgICAgPyB7IGlkOiByb29tLnVzZXIySWQsIHVzZXJuYW1lOiByb29tLnVzZXIyPy51c2VybmFtZSB9XG4gICAgICAgICAgOiB7IGlkOiByb29tLnVzZXIxSWQsIHVzZXJuYW1lOiByb29tLnVzZXIxPy51c2VybmFtZSB9XG4gICAgICB9KSlcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHVucmVhZE1lc3NhZ2VzOiB1bnJlYWREYXRhIH0pXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgdW5yZWFkIG1lc3NhZ2VzOicsIGVycm9yKVxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9LCB7IHN0YXR1czogNTAwIH0pXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJnZXRTZXJ2ZXJTZXNzaW9uIiwiYXV0aE9wdGlvbnMiLCJwcmlzbWEiLCJHRVQiLCJyZXF1ZXN0Iiwic2Vzc2lvbiIsInVzZXIiLCJpZCIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImNoYXRSb29tcyIsImNoYXRSb29tIiwiZmluZE1hbnkiLCJ3aGVyZSIsIk9SIiwidXNlcjFJZCIsInVzZXIySWQiLCJpbmNsdWRlIiwibWVzc2FnZXMiLCJzZW5kZXJJZCIsIm5vdCIsInJlYWRTdGF0dXMiLCJub25lIiwidXNlcklkIiwic2VuZGVyIiwic2VsZWN0IiwidXNlcm5hbWUiLCJvcmRlckJ5IiwiY3JlYXRlZEF0IiwidGFrZSIsInVucmVhZERhdGEiLCJmaWx0ZXIiLCJyb29tIiwibGVuZ3RoIiwibWFwIiwicm9vbUlkIiwidW5yZWFkQ291bnQiLCJsYXRlc3RNZXNzYWdlIiwib3RoZXJVc2VyIiwidXNlcjIiLCJ1c2VyMSIsInVucmVhZE1lc3NhZ2VzIiwiY29uc29sZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/chat/unread/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst authOptions = {\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    },\n    pages: {\n        signIn: \"/auth/login\",\n        signOut: \"/\",\n        error: \"/auth/login\"\n    },\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    throw new Error(\"Invalid credentials\");\n                }\n                const user = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    }\n                });\n                if (!user || !user?.password) {\n                    throw new Error(\"No user found with this email\");\n                }\n                const isCorrectPassword = await bcryptjs__WEBPACK_IMPORTED_MODULE_2___default().compare(credentials.password, user.password);\n                if (!isCorrectPassword) {\n                    throw new Error(\"Incorrect password\");\n                }\n                return {\n                    id: user.id,\n                    email: user.email,\n                    username: user.username,\n                    name: user.name,\n                    image: user.image,\n                    balance: user.balance,\n                    wins: user.wins,\n                    losses: user.losses\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                return {\n                    ...token,\n                    id: user.id,\n                    username: user.username,\n                    balance: user.balance,\n                    wins: user.wins,\n                    losses: user.losses\n                };\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            return {\n                ...session,\n                user: {\n                    ...session.user,\n                    id: token.id,\n                    username: token.username,\n                    balance: token.balance,\n                    wins: token.wins,\n                    losses: token.losses\n                }\n            };\n        },\n        async redirect ({ url, baseUrl }) {\n            // Handle logout redirect\n            if (url.startsWith(\"/\")) {\n                return `${baseUrl}${url}`;\n            } else if (new URL(url).origin === baseUrl) {\n                return url;\n            }\n            return baseUrl;\n        }\n    },\n    events: {\n        async signOut () {\n        // Handle any cleanup needed on sign out\n        }\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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aWIvYXV0aC50cz82NjkyIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRBdXRoT3B0aW9ucyB9IGZyb20gJ25leHQtYXV0aCdcbmltcG9ydCBDcmVkZW50aWFsc1Byb3ZpZGVyIGZyb20gJ25leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHMnXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tICcuL3ByaXNtYSdcbmltcG9ydCBiY3J5cHQgZnJvbSAnYmNyeXB0anMnXG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogTmV4dEF1dGhPcHRpb25zID0ge1xuICBzZXNzaW9uOiB7XG4gICAgc3RyYXRlZ3k6ICdqd3QnLFxuICAgIG1heEFnZTogMzAgKiAyNCAqIDYwICogNjAsIC8vIDMwIGRheXNcbiAgfSxcbiAgcGFnZXM6IHtcbiAgICBzaWduSW46ICcvYXV0aC9sb2dpbicsXG4gICAgc2lnbk91dDogJy8nLFxuICAgIGVycm9yOiAnL2F1dGgvbG9naW4nLFxuICB9LFxuICBwcm92aWRlcnM6IFtcbiAgICBDcmVkZW50aWFsc1Byb3ZpZGVyKHtcbiAgICAgIG5hbWU6ICdjcmVkZW50aWFscycsXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBlbWFpbDogeyBsYWJlbDogJ0VtYWlsJywgdHlwZTogJ2VtYWlsJyB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogJ1Bhc3N3b3JkJywgdHlwZTogJ3Bhc3N3b3JkJyB9XG4gICAgICB9LFxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgIGlmICghY3JlZGVudGlhbHM/LmVtYWlsIHx8ICFjcmVkZW50aWFscz8ucGFzc3dvcmQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3JlZGVudGlhbHMnKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICBlbWFpbDogY3JlZGVudGlhbHMuZW1haWxcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyPy5wYXNzd29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdXNlciBmb3VuZCB3aXRoIHRoaXMgZW1haWwnKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNDb3JyZWN0UGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShcbiAgICAgICAgICBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgICAgICB1c2VyLnBhc3N3b3JkXG4gICAgICAgIClcblxuICAgICAgICBpZiAoIWlzQ29ycmVjdFBhc3N3b3JkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3QgcGFzc3dvcmQnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogdXNlci5pZCxcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICB1c2VybmFtZTogdXNlci51c2VybmFtZSxcbiAgICAgICAgICBuYW1lOiB1c2VyLm5hbWUsXG4gICAgICAgICAgaW1hZ2U6IHVzZXIuaW1hZ2UsXG4gICAgICAgICAgYmFsYW5jZTogdXNlci5iYWxhbmNlLFxuICAgICAgICAgIHdpbnM6IHVzZXIud2lucyxcbiAgICAgICAgICBsb3NzZXM6IHVzZXIubG9zc2VzXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICBdLFxuICBjYWxsYmFja3M6IHtcbiAgICBhc3luYyBqd3QoeyB0b2tlbiwgdXNlciB9KSB7XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnRva2VuLFxuICAgICAgICAgIGlkOiB1c2VyLmlkLFxuICAgICAgICAgIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLFxuICAgICAgICAgIGJhbGFuY2U6IHVzZXIuYmFsYW5jZSxcbiAgICAgICAgICB3aW5zOiB1c2VyLndpbnMsXG4gICAgICAgICAgbG9zc2VzOiB1c2VyLmxvc3Nlc1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW5cbiAgICB9LFxuICAgIGFzeW5jIHNlc3Npb24oeyBzZXNzaW9uLCB0b2tlbiB9KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5zZXNzaW9uLFxuICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgLi4uc2Vzc2lvbi51c2VyLFxuICAgICAgICAgIGlkOiB0b2tlbi5pZCxcbiAgICAgICAgICB1c2VybmFtZTogdG9rZW4udXNlcm5hbWUsXG4gICAgICAgICAgYmFsYW5jZTogdG9rZW4uYmFsYW5jZSxcbiAgICAgICAgICB3aW5zOiB0b2tlbi53aW5zLFxuICAgICAgICAgIGxvc3NlczogdG9rZW4ubG9zc2VzXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHJlZGlyZWN0KHsgdXJsLCBiYXNlVXJsIH0pIHtcbiAgICAgIC8vIEhhbmRsZSBsb2dvdXQgcmVkaXJlY3RcbiAgICAgIGlmICh1cmwuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICAgIHJldHVybiBgJHtiYXNlVXJsfSR7dXJsfWBcbiAgICAgIH0gZWxzZSBpZiAobmV3IFVSTCh1cmwpLm9yaWdpbiA9PT0gYmFzZVVybCkge1xuICAgICAgICByZXR1cm4gdXJsXG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZVVybFxuICAgIH1cbiAgfSxcbiAgZXZlbnRzOiB7XG4gICAgYXN5bmMgc2lnbk91dCgpIHtcbiAgICAgIC8vIEhhbmRsZSBhbnkgY2xlYW51cCBuZWVkZWQgb24gc2lnbiBvdXRcbiAgICB9XG4gIH1cbn0gIl0sIm5hbWVzIjpbIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJwcmlzbWEiLCJiY3J5cHQiLCJhdXRoT3B0aW9ucyIsInNlc3Npb24iLCJzdHJhdGVneSIsIm1heEFnZSIsInBhZ2VzIiwic2lnbkluIiwic2lnbk91dCIsImVycm9yIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsIkVycm9yIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImlzQ29ycmVjdFBhc3N3b3JkIiwiY29tcGFyZSIsImlkIiwidXNlcm5hbWUiLCJpbWFnZSIsImJhbGFuY2UiLCJ3aW5zIiwibG9zc2VzIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJyZWRpcmVjdCIsInVybCIsImJhc2VVcmwiLCJzdGFydHNXaXRoIiwiVVJMIiwib3JpZ2luIiwiZXZlbnRzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = global;\nconst prisma = globalForPrisma.prisma || new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log: [\n        \"query\"\n    ]\n});\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBNkM7QUFFN0MsTUFBTUMsa0JBQWtCQztBQUVqQixNQUFNQyxTQUNYRixnQkFBZ0JFLE1BQU0sSUFDdEIsSUFBSUgsd0RBQVlBLENBQUM7SUFDZkksS0FBSztRQUFDO0tBQVE7QUFDaEIsR0FBRTtBQUVKLElBQUlDLElBQXlCLEVBQWNKLGdCQUFnQkUsTUFBTSxHQUFHQSIsInNvdXJjZXMiOlsid2VicGFjazovL2JldC10aGUtZnJpZW5kLy4vc3JjL2xpYi9wcmlzbWEudHM/MDFkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcblxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsIGFzIHVua25vd24gYXMgeyBwcmlzbWE6IFByaXNtYUNsaWVudCB9XG5cbmV4cG9ydCBjb25zdCBwcmlzbWEgPVxuICBnbG9iYWxGb3JQcmlzbWEucHJpc21hIHx8XG4gIG5ldyBQcmlzbWFDbGllbnQoe1xuICAgIGxvZzogWydxdWVyeSddLFxuICB9KVxuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYSAiXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsIiwicHJpc21hIiwibG9nIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/jose","vendor-chunks/next-auth","vendor-chunks/next","vendor-chunks/openid-client","vendor-chunks/@babel","vendor-chunks/uuid","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/oidc-token-hash","vendor-chunks/bcryptjs","vendor-chunks/preact","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fchat%2Funread%2Froute&page=%2Fapi%2Fchat%2Funread%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fchat%2Funread%2Froute.ts&appDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmitchellsibenik%2FDesktop%2FBetTheFriend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
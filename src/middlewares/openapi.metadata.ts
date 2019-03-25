const pathToRegexp = require('path-to-regexp');
const _ = require('lodash');
import { OpenApiContext } from '../openapi.context';

export function applyOpenApiMetadata(openApiContext: OpenApiContext) {
  return (req, res, next) => {
    req.openapi = {};
    const matched = lookupRoute(req);

    if (matched) {
      const { expressRoute, openApiRoute, pathParams, schema } = matched;
      req.openapi.expressRoute = expressRoute;
      req.openapi.openApiRoute = openApiRoute;
      req.openapi.pathParams = pathParams;
      req.openapi.schema = schema;
      req.params = pathParams;
    }
    next();
  };

  function lookupRoute(req) {
    const path = req.path;
    const method = req.method;
    const routeEntries = Object.entries(openApiContext.expressRouteMap);
    for (const [expressRoute, methods] of routeEntries) {
      const schema = methods[method];
      const routePair = openApiContext.routePair(expressRoute);
      const openApiRoute = routePair.openApiRoute;

      const keys = [];
      const regexp = pathToRegexp(expressRoute, keys);
      const matchedRoute = regexp.exec(path);

      if (matchedRoute) {
        const paramKeys = keys.map(k => k.name);
        const paramsVals = matchedRoute.slice(1);
        const pathParams = _.zipObject(paramKeys, paramsVals);

        return {
          schema,
          // schema may or may not contain express and openApi routes,
          // thus we include them here
          expressRoute,
          openApiRoute,
          pathParams,
        };
      }
    }

    return null;
  }
}
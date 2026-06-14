/**
 * HTTP status code reference dataset, fully client-side. A comprehensive
 * registry of standard status codes (RFC 9110 and friends) plus pure,
 * unit-tested helpers for categorizing and searching them.
 */

export type HttpCategory = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

export interface HttpStatus {
  code: number;
  name: string;
  description: string;
  category: HttpCategory;
}

export const HTTP_STATUS: HttpStatus[] = [
  // 1xx — Informational
  {
    code: 100,
    name: 'Continue',
    description: 'The client should continue with its request after the interim response.',
    category: '1xx',
  },
  {
    code: 101,
    name: 'Switching Protocols',
    description: 'The server is switching protocols as requested by the client in an Upgrade header.',
    category: '1xx',
  },
  {
    code: 102,
    name: 'Processing',
    description: 'The server has received and is processing the request but no response is available yet.',
    category: '1xx',
  },
  {
    code: 103,
    name: 'Early Hints',
    description: 'Returns some response headers early so the client can begin preloading resources.',
    category: '1xx',
  },

  // 2xx — Success
  {
    code: 200,
    name: 'OK',
    description: 'The request succeeded and the response carries the requested payload.',
    category: '2xx',
  },
  {
    code: 201,
    name: 'Created',
    description: 'The request succeeded and a new resource was created as a result.',
    category: '2xx',
  },
  {
    code: 202,
    name: 'Accepted',
    description: 'The request was accepted for processing but has not yet been completed.',
    category: '2xx',
  },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    description: 'The returned metadata differs from the origin server and comes from a transforming proxy.',
    category: '2xx',
  },
  {
    code: 204,
    name: 'No Content',
    description: 'The request succeeded but there is no content to send in the response body.',
    category: '2xx',
  },
  {
    code: 205,
    name: 'Reset Content',
    description: 'The request succeeded and the client should reset the document view that sent it.',
    category: '2xx',
  },
  {
    code: 206,
    name: 'Partial Content',
    description: 'The server is delivering only part of the resource in response to a Range header.',
    category: '2xx',
  },
  {
    code: 207,
    name: 'Multi-Status',
    description: 'Conveys multiple independent status codes for separate operations in a WebDAV request.',
    category: '2xx',
  },
  {
    code: 208,
    name: 'Already Reported',
    description: 'The members of a WebDAV binding have already been enumerated and are not repeated.',
    category: '2xx',
  },
  {
    code: 226,
    name: 'IM Used',
    description: 'The server fulfilled the request and the response is the result of instance manipulations.',
    category: '2xx',
  },

  // 3xx — Redirection
  {
    code: 300,
    name: 'Multiple Choices',
    description: 'The request has more than one possible response and the client should choose one.',
    category: '3xx',
  },
  {
    code: 301,
    name: 'Moved Permanently',
    description: 'The requested resource has been permanently moved to a new URL given in the Location header.',
    category: '3xx',
  },
  {
    code: 302,
    name: 'Found',
    description: 'The requested resource resides temporarily under a different URL.',
    category: '3xx',
  },
  {
    code: 303,
    name: 'See Other',
    description: 'The response can be found at another URL that should be retrieved with a GET request.',
    category: '3xx',
  },
  {
    code: 304,
    name: 'Not Modified',
    description: 'The resource has not changed since the version specified by the conditional request headers.',
    category: '3xx',
  },
  {
    code: 305,
    name: 'Use Proxy',
    description: 'The requested resource must be accessed through the proxy given in the Location header.',
    category: '3xx',
  },
  {
    code: 306,
    name: 'Switch Proxy',
    description: 'No longer used; this code is reserved from a previous version of the specification.',
    category: '3xx',
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    description: 'The resource is temporarily at a different URL and the request method must not change.',
    category: '3xx',
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    description: 'The resource is permanently at a different URL and the request method must not change.',
    category: '3xx',
  },

  // 4xx — Client Error
  {
    code: 400,
    name: 'Bad Request',
    description: 'The server cannot process the request due to a client error such as malformed syntax.',
    category: '4xx',
  },
  {
    code: 401,
    name: 'Unauthorized',
    description: 'The request lacks valid authentication credentials for the target resource.',
    category: '4xx',
  },
  {
    code: 402,
    name: 'Payment Required',
    description: 'Reserved for future use, originally intended for digital payment systems.',
    category: '4xx',
  },
  {
    code: 403,
    name: 'Forbidden',
    description: 'The server understood the request but refuses to authorize it.',
    category: '4xx',
  },
  {
    code: 404,
    name: 'Not Found',
    description: 'The server cannot find the requested resource.',
    category: '4xx',
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    description: 'The request method is known by the server but is not supported by the target resource.',
    category: '4xx',
  },
  {
    code: 406,
    name: 'Not Acceptable',
    description: 'The resource cannot produce a response matching the criteria in the request Accept headers.',
    category: '4xx',
  },
  {
    code: 407,
    name: 'Proxy Authentication Required',
    description: 'The client must first authenticate itself with the proxy before the request can proceed.',
    category: '4xx',
  },
  {
    code: 408,
    name: 'Request Timeout',
    description: 'The server timed out waiting for the client to finish sending the request.',
    category: '4xx',
  },
  {
    code: 409,
    name: 'Conflict',
    description: 'The request conflicts with the current state of the target resource.',
    category: '4xx',
  },
  {
    code: 410,
    name: 'Gone',
    description: 'The requested resource is no longer available and will not be available again.',
    category: '4xx',
  },
  {
    code: 411,
    name: 'Length Required',
    description: 'The server requires a Content-Length header that the request did not provide.',
    category: '4xx',
  },
  {
    code: 412,
    name: 'Precondition Failed',
    description: 'One or more conditions given in the request headers evaluated to false on the server.',
    category: '4xx',
  },
  {
    code: 413,
    name: 'Payload Too Large',
    description: 'The request entity is larger than the limits the server is willing or able to process.',
    category: '4xx',
  },
  {
    code: 414,
    name: 'URI Too Long',
    description: 'The URI requested by the client is longer than the server is willing to interpret.',
    category: '4xx',
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    description: 'The payload format is in a media type the server or resource does not support.',
    category: '4xx',
  },
  {
    code: 416,
    name: 'Range Not Satisfiable',
    description: 'The range specified by the Range header cannot be fulfilled for the target resource.',
    category: '4xx',
  },
  {
    code: 417,
    name: 'Expectation Failed',
    description: 'The expectation given in the request Expect header could not be met by the server.',
    category: '4xx',
  },
  {
    code: 418,
    name: "I'm a teapot",
    description: 'The server refuses to brew coffee because it is, permanently, a teapot.',
    category: '4xx',
  },
  {
    code: 421,
    name: 'Misdirected Request',
    description: 'The request was directed at a server that is not able to produce a response for it.',
    category: '4xx',
  },
  {
    code: 422,
    name: 'Unprocessable Entity',
    description: 'The request was well formed but could not be followed due to semantic errors.',
    category: '4xx',
  },
  {
    code: 423,
    name: 'Locked',
    description: 'The resource that is being accessed is locked.',
    category: '4xx',
  },
  {
    code: 424,
    name: 'Failed Dependency',
    description: 'The request failed because it depended on another request that also failed.',
    category: '4xx',
  },
  {
    code: 425,
    name: 'Too Early',
    description: 'The server is unwilling to risk processing a request that might be replayed.',
    category: '4xx',
  },
  {
    code: 426,
    name: 'Upgrade Required',
    description: 'The client should switch to a different protocol given in the Upgrade header.',
    category: '4xx',
  },
  {
    code: 428,
    name: 'Precondition Required',
    description: 'The origin server requires the request to be conditional to avoid lost updates.',
    category: '4xx',
  },
  {
    code: 429,
    name: 'Too Many Requests',
    description: 'The client has sent too many requests in a given amount of time and is rate limited.',
    category: '4xx',
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    description: 'The server refuses to process the request because its header fields are too large.',
    category: '4xx',
  },
  {
    code: 451,
    name: 'Unavailable For Legal Reasons',
    description: 'The resource is unavailable because of a legal demand to deny access to it.',
    category: '4xx',
  },

  // 5xx — Server Error
  {
    code: 500,
    name: 'Internal Server Error',
    description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
    category: '5xx',
  },
  {
    code: 501,
    name: 'Not Implemented',
    description: 'The server does not support the functionality required to fulfill the request.',
    category: '5xx',
  },
  {
    code: 502,
    name: 'Bad Gateway',
    description: 'The server, acting as a gateway, received an invalid response from the upstream server.',
    category: '5xx',
  },
  {
    code: 503,
    name: 'Service Unavailable',
    description: 'The server is not ready to handle the request, often due to maintenance or overload.',
    category: '5xx',
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    description: 'The server, acting as a gateway, did not get a timely response from the upstream server.',
    category: '5xx',
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    description: 'The server does not support the HTTP protocol version used in the request.',
    category: '5xx',
  },
  {
    code: 506,
    name: 'Variant Also Negotiates',
    description: 'The server has an internal configuration error in transparent content negotiation.',
    category: '5xx',
  },
  {
    code: 507,
    name: 'Insufficient Storage',
    description: 'The server cannot store the representation needed to complete the request.',
    category: '5xx',
  },
  {
    code: 508,
    name: 'Loop Detected',
    description: 'The server terminated the request because it detected an infinite loop while processing it.',
    category: '5xx',
  },
  {
    code: 510,
    name: 'Not Extended',
    description: 'Further extensions to the request are required for the server to fulfill it.',
    category: '5xx',
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    description: 'The client must authenticate to gain network access, often behind a captive portal.',
    category: '5xx',
  },
];

export function getCategory(code: number): HttpCategory | 'unknown' {
  if (code >= 100 && code <= 199) return '1xx';
  if (code >= 200 && code <= 299) return '2xx';
  if (code >= 300 && code <= 399) return '3xx';
  if (code >= 400 && code <= 499) return '4xx';
  if (code >= 500 && code <= 599) return '5xx';
  return 'unknown';
}

export function searchStatus(query: string): HttpStatus[] {
  const trimmed = query.trim();
  if (trimmed === '') return HTTP_STATUS;

  const lower = trimmed.toLowerCase();
  return HTTP_STATUS.filter(
    (status) =>
      String(status.code).startsWith(trimmed) ||
      status.name.toLowerCase().includes(lower) ||
      status.description.toLowerCase().includes(lower),
  );
}

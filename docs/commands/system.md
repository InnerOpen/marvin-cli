# Health & Version

Two utility commands that need no sign-in: check that a Marvin API is reachable, and print the version of
the CLI itself. For server-side details (server version, configuration, statistics) use
[Admin system](admin-system.md).

## Commands

```bash
marvin system health
marvin system version
```

Neither takes options beyond the [global options](overview.md).

## Health

```bash
marvin system health
marvin system health --api-url https://marvin.example.com
marvin system health --json
```

Calls the API's public health endpoint, with no token. The API URL comes from `--api-url` or the
`MARVIN_API_URL` environment variable; if neither is set the command exits 1 with an error.

On success it prints `API is healthy`, the URL it checked and whatever the endpoint returned. With
`--json` or `--yaml` the output is a single object:

```json
{ "healthy": true, "url": "https://marvin.example.com", "response": null }
```

`response` holds the endpoint's reply, or `null` when it sends none. When the API cannot be reached the
command prints `Failed to reach API` with the error and exits 1, so it works as a script gate:

```bash
marvin system health --api-url "$MARVIN_API_URL" >/dev/null 2>&1 || { echo "Marvin is down"; exit 1; }
```

## Version

```bash
marvin system version
marvin system version --json
```

Prints `Marvin CLI v<version>`, or `{"version": "<version>"}` with `--json` or `--yaml`. This is the
installed CLI's version, not the server's; the server's is in `marvin admin system info`.

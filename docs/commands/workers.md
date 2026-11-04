# Workers

Workers run heavy jobs (ffmpeg, PDFs, anything that does not belong in the API) as a runner, a dispatcher, a container or a Kubernetes
Job. They read and write three kinds of record by slug: `job`, `job-kind` and `worker`. Core ships them as the **Workers** blueprints;
`workers setup` adds whichever the workspace is missing.

## Commands

```bash
marvin platform workers setup
```

!!! note "Required role"
    `setup` changes workspace structure and needs the workspace **ADMIN** (or OWNER) role.

## setup

```bash
marvin platform workers setup
marvin platform workers setup --json
```

It is `marvin platform blueprints apply job job-kind worker --source core` with the next steps said aloud. It creates what is
missing and never overwrites what exists, so a workspace that already has a `job` type of its own keeps it, and running `setup` twice
changes nothing. The second run says the workspace is already set up.

Then make a token that can reach only this workspace and start a worker with it:

```bash
marvin user tokens create --name worker --pin <workspace-slug>
```

A worker authenticates with that token (`MARVIN_USER_TOKEN`) and the API address (`MARVIN_API_URL`); Settings -> Workers in the web
app shows the commands for a process, Docker, Podman and Kubernetes.

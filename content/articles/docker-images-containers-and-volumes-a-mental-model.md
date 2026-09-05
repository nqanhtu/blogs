---
title: Docker Images, Containers and Volumes — A Mental Model
slug: docker-images-containers-and-volumes-a-mental-model
description: A practical, layer-oriented mental model for understanding how Docker images, running containers, copy-on-write storage, and persistent volumes interact.
type: research
tags:
  - docker
  - devops
  - infrastructure
  - containers
publishedAt: 2026-09-01
---

When engineers struggle with Docker, it is almost never because the syntax is difficult. It is because their mental model treats containers like lightweight virtual machines. 

A container is not a machine. A container is a regular Linux process running with kernel-enforced namespace isolation and cgroup resource boundaries, rooted in a stacked read-only filesystem with a thin copy-on-write layer on top.

Once this model clicks, commands like `docker commit`, volume mounts, and multi-stage builds become completely intuitive.

## 1. The Stacked Filesystem: Images as Immutable Deltas

A Docker image is fundamentally a collection of read-only tarballs stacked on top of one another via an overlay filesystem (such as `overlay2`). 

Every instruction in your `Dockerfile` creates a layer:

```dockerfile
# Layer 1: Base distribution binaries and directories
FROM alpine:3.20

# Layer 2: Package manager updates and runtime
RUN apk add --no-cache nodejs npm

# Layer 3: Application source code
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .

# Metadata only (no disk layer created)
EXPOSE 3000
CMD ["node", "server.js"]
```

Each layer only records the *diff* between itself and the layer below it. If Layer 2 creates a file and Layer 3 deletes it, Layer 3 does not actually remove bytes from Layer 2. Instead, Layer 3 writes a special marker called a *whiteout file* that hides the underlying file from the unified view.

### Layer Properties Comparison

| Property | Image Layer | Container Layer | Volume |
| :--- | :--- | :--- | :--- |
| **Mutability** | Read-only (Immutable) | Read-write (Ephemeral) | Read-write (Persistent) |
| **Lifecycle** | Persists across containers | Destroyed with container | Decoupled from container |
| **Storage Driver** | overlay2 (host disk) | overlay2 (Copy-on-Write) | Direct host mount / block device |
| **Performance** | High read speed | Write penalty on first write | Native filesystem throughput |

## 2. Containers: Isolated Processes with a Scratchpad

When you run `docker run -d my-app`, Docker does not boot an operating system kernel. Instead, it performs two distinct actions:

1. **Allocates a writable layer:** Places a thin, writable container layer directly atop the immutable image stack.
2. **Spawns the process:** Forks a new process under `clone()` with namespaces for `PID`, `NET`, `MNT`, `IPC`, `UTS`, and `USER`.

```bash
# Inspect the mount layers of any active container
docker inspect --format '{{json .GraphDriver.Data}}' my-running-container
```

### The Copy-on-Write (CoW) Penalty

When a process inside a container modifies an existing file that came from an image layer:

1. The kernel searches the overlay stack downwards to find the file.
2. The entire file is copied up into the container's writable scratchpad layer.
3. The process modifies the newly copied file in place.

> **Key Takeaway:** If your application frequently writes to disk (such as databases, log files, or temp files), never write directly to the container layer. The copy-on-write operation introduces measurable I/O latency and bloats your container scratch space.

## 3. Volumes: Piercing the Abstraction

Docker volumes bypass the `overlay2` storage driver completely. 

When you attach a volume:

```bash
docker run -d \
  --name postgres-db \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

The directory `/var/lib/postgresql/data` inside the container is directly mounted to a host path (typically under `/var/lib/docker/volumes/pgdata/_data`). 

Writes to this directory bypass the container layer entirely. They hit the host filesystem at native speed, and they survive container removal (`docker rm -f postgres-db`).

## Summary

* **Image:** A cryptographic hash chain of read-only tarball deltas.
* **Container:** An isolated Linux process with a temporary, writable scratchpad layer mounted on top.
* **Volume:** A direct host mount that bypasses the copy-on-write driver for native I/O performance and persistence.

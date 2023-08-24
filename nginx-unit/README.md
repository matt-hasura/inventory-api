# NGINX Unit
This Dockerfile is based on the officially maintained [Dockerfile](https://github.com/nginx/unit/blob/master/pkg/docker/Dockerfile.node18). It swaps out the `node:18-bullseye` image for `node:20-bullseye-slim` to use the latest version of Node.js and to reduce the size of the container image.

## Prerequisites
##### Docker BuildKit
The build shell script uses the Docker [BuildKit](https://docs.docker.com/build/buildkit/) to create multi-arch compatible images and assumes you have an existing builder that supports multiple architectures (e.g. `amd64` and `arm64`) set as the default.

##### Container Registry
The build shell script will automatically push the container images to your container registry.

## Instructions
1. Modify the *Dockerfile* to change the maintainer and optionally change the base image.
   
2. Run the *build.sh* script:
   
   ```bash
   $ ./build.sh
     
     Usage: build.sh [required] [optional]
     
       Required:
         --repo                    example:  igraphql/nginx-unit
         --tag                     example:  1.30.0-node20
     
       Optional:
         --arch                    default:  linux/amd64,linux/arm64
   ```
   
3. Run the *build.sh* script again with the required arguments:
   
   ```bash
   $ ./build.sh --repo <name> --tag <tag>
   ```

#!/bin/sh

if [ $# -lt 4 ]; then
  echo "\n  Usage: ${0##*/} [required] [optional]\n"
  echo "    Required:"
  echo "      --repo                    example:  igraphql/nginx-unit"
  echo "      --tag                     example:  1.30.0-node20\n"
  echo "    Optional:"
  echo "      --arch                    default:  linux/amd64,linux/arm64\n"
  exit 1
fi

while [ $# -gt 1 ]; do
  case "$1" in
    "--arch" )
        arch=${2%/}
        shift; shift
        ;;
    "--repo" )
        repo=${2%/}
        shift; shift
        ;;
    "--tag" )
        tag=${2%/}
        shift; shift
        ;;
    * )
        echo "\n  Invalid argument: $1\n"
        exit 1
        ;;
  esac
done

if [ -z "${arch}" ]; then
  arch=linux/amd64,linux/arm64
fi

if [ -z "${repo}" ]; then
  echo "\n  Missing required argument: --repo\n"
  exit 1
fi

if [ -z "${tag}" ]; then
  echo "\n  Missing required argument: --tag\n"
  exit 1
fi

docker buildx build --progress plain --platform ${arch} --file Dockerfile --tag ${repo}:${tag} --push .

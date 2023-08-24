## Configuration
The application is configured through environment variables:

| Variable            | Value                     | Default    | Notes                   |
| :------------------ | :-----------------------: | :--------: | :---------------------- |
| ACCESS_LOG          | true &#124; false         | false      | Enable app access log   |
| BASE_PATH           | {string}                  | /api/v1    | API base prefix         |
| DATABASE_TYPE       | postgres &#124; snowflake | postgres   | Database type           |
| LOG_SQL             | true &#124; false         | false      | Enable SQL log          |
| POSTGRES_CA         | {string}                  |            | Postgres CA file        |
| POSTGRES_DATABASE   | {string}                  |            | Postgres database       |
| POSTGRES_HOST       | {string}                  |            | Postgres hostname       |
| POSTGRES_PASSWORD   | {string}                  | pgpassword | Postgres password       |
| POSTGRES_PORT       | {integer}                 | 5432       | Postgres port           |
| POSTGRES_SCHEMA     | {string}                  | public     | Postgres schema         |
| POSTGRES_SSL        | true &#124; false         | false      | Postgres SSL            |
| POSTGRES_USERNAME   | {string}                  | postgres   | Postgres username       |
| SERVER_CA           | {string}                  |            | N/A                     |
| SERVER_CERT         | {string}                  |            | Express TLS certificate |
| SERVER_KEY          | {string}                  |            | Express TLS key         |
| SNOWFLAKE_ACCOUNT   | {string}                  |            | Snowflake account       |
| SNOWFLAKE_DATABASE  | {string}                  |            | Snowflake database      |
| SNOWFLAKE_PASSWORD  | {string}                  |            | Snowflake password      |
| SNOWFLAKE_SCHEMA    | {string}                  |            | Snowflake schema        |
| SNOWFLAKE_USERNAME  | {string}                  |            | Snowflake username      |
| SNOWFLAKE_WAREHOUSE | {string}                  |            | Snowflake warehouse     |

## Custom Image
### Prerequisites
##### Docker BuildKit
The build shell script uses the Docker [BuildKit](https://docs.docker.com/build/buildkit/) to create multi-arch compatible images and assumes you have an existing builder that supports multiple architectures (e.g. `amd64` and `arm64`) set as the default.

##### Container Registry
The build shell script will automatically push the container images to your container registry.

### Build Instructions
A pre-built container image is available at `igraphql/inventory-monolith:latest`. To build a custom image, use the following instructions:

1. Modify the *Dockerfile* to change the maintainer and optionally change the base image.
   
2. Run the *build.sh* script:
   
   ```bash
   $ ./build.sh
   
     Usage: build.sh [required] [optional]
     
       Required:
         --repo                    example:  igraphql/inventory-monolith
         --tag                     example:  latest
   
       Optional:
         --arch                    default:  linux/amd64,linux/arm64
   ```
   
3. Run the *build.sh* script with the required arguments:
   
   ```bash
   $ ./build.sh --repo <name> --tag <tag>
   ```

## Custom TLS Certicate/Key
The pre-built container image contains a self-signed certificate for `*.igraphql.co`. To use your own custom certificate, the following items need to be changed:

1. **NGINX**

   The NGINX TLS certificate and key are located in the `./source/nginx/certs` directory. The corresponding configuration file located at `./source/nginx/default.conf` will also need to be updated with the new hostnames.
   
3. **NGINX Unit**

   The NGINX Unit TLS certificate file is located in the `./source/unit` directory and is a [bundle](https://unit.nginx.org/certificates/) containing the certificate, chain, and key. The corresponding configuration file located at `./source/unit/conf.json` will also need to be updated with the new bundle name.
   
5. **Swagger OpenAPI**

   The OpenAPI swagger file located at `./source/openapi/swagger.yaml` will need to be updated to the new hostname.
   
7. **Docker Compose**

   The links in the `docker-compose.yaml` file will need to be updated with the new container images and hostnames.

# Inventory API
This is an inventory API built for demonstration purposes only. It is available in monolith or microservices form factor.

## Installation
1. Clone the *inventory-api* repository:
   
   ```bash
   $ git clone https://github.com/matt-hasura/inventory-api.git
   $ cd inventory-api
   ```
   
2. From the root directory, select the version of the API you want to run by changing to the corresponding directory:
   
   **Monolith**:
   ```bash
   $ cd monolith
   ```
   
   **Microservice**:
   ```bash
   $ cd microservice
   ```

3. Run the Docker Compose file:
   
   ```bash
   $ docker compose up -d
   ```
   
4. A Swagger specification for the API is available at https://inventory-api.igraphql.co/swagger-ui.

**Notes**:
- To use Snowlake as your database, modify the *docker-compose.yaml* file to include the appropriate environment variables (see documentation for details).
- Modify your hosts file to point `inventory-api.igraphql.co` to `127.0.0.1`.


## Custom Images
The pre-built container images use [NGINX Unit](https://hub.docker.com/_/unit) as a framework wrapped around Node.js and Express. See the instructions in each directory to build your own container images.

1. clone the repository
```bash
git clone <repository-url>
```

2. change directory to the cloned repository
```bash
cd <repository-name>
```

3. install the dependencies
```bash
npm install
```

4. run the application
```bash
node server.js
```

6. run the postgresql database
```bash
docker run --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=Test123 -d postgres
```

7. add the data to the database by running the console.sql script in the database

8. test the application with requests in scratch.http

Do not forget to close (and delete) the docker container after you are done testing
```bash
docker stop postgres
docker rm postgres
```

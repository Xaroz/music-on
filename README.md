# music-on

<p align="center">
<a href="https://nodejs.org/en/"><img src="https://img.shields.io/badge/node--js-v16.x.x-green" alt="node-js" /></a>
<a href="https://www.npmjs.com/package/typescript"><img src="https://img.shields.io/badge/typescript-v5.x.x-blue" alt="typescript" /></a>
<a href="https://www.npmjs.com/package/mongoose"><img src="https://img.shields.io/badge/mongoose-v7.x.x-green" alt="mongoose" /></a> 
<a href="https://choosealicense.com/licenses/mit/" target="_blank"><img src="https://img.shields.io/badge/license-MIT-green" alt="Package License" ></a>
</p>

## Description

The Music On API main objective is to allow an easier and complete solution for managing music resources.Currently the main features of the API are:
1. Getting and uploading tracks
2. Adding tracks to playlists
3. Becoming an artist to upload music
4. Organizing tracks with genres
5. Secure endpoints and control access with authentication and authorization
6. Filters and pagination on resources

## Main technologies used
1. Node-JS & Express
2. MongoDB & Mongoose
3. Typescript
4. Cloud storage with AWS-S3

## How to run the project

With npm installed on your machine, install project dependencies running the following command:

```cmd
npm i
```

Create a `.env` file in the root of the project that holds the variables in the [this file](.env.testing)

## Development mode

Make sure in your `.env` to add `NODE_ENV=development` and run the following command
```cmd
npm run dev
```

## Production mode
Make sure in your `.env` to add `NODE_ENV=production` and run the following command
```cmd
npm run build
npm start
```

## API Documentation
WIP

## Contributing
Contributions are welcome! If you find any issues or want to add new features, feel free to open a pull request.

## License

[MIT](https://choosealicense.com/licenses/mit/)


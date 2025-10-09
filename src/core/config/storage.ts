// src/core/config/storage.ts
export const storageConfig = {
    provider: process.env.STORAGE_PROVIDER || "aws", // aws | azure | local

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        bucket: process.env.AWS_BUCKET!,
        region: process.env.AWS_REGION!,
    },

    azure: {
        connectionString: process.env.AZURE_CONNECTION_STRING!,
        containerName: process.env.AZURE_CONTAINER!,
    },

    local: {
        path: "uploads/",
        baseUrl: process.env.APP_URL + "/uploads/",
    },
};

const { BlobServiceClient } = require("@azure/storage-blob");
const crypto = require("crypto");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const service = BlobServiceClient.fromConnectionString(connectionString);
const contaier = service.getBlobBatchClient(AZURE_STORAGE_CONTAINER || "receipts");

async function uploadReceipt(file)
{

}
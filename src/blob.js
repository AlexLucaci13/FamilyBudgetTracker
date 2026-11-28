const { BlobServiceClient } = require("@azure/storage-blob");
const crypto = require("crypto");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const service = BlobServiceClient.fromConnectionString(connectionString);
const contaier = service.getBlobBatchClient(AZURE_STORAGE_CONTAINER || "receipts");

async function uploadReceipt(file)
{
    const name = "";
    await ContainerClient.getBlockBlobClien(name).uploadData(file.buffer,{
        blobHTTPHeaders : { blobContentType: file.mimetype}
    });
    return name;
}

async function downloadReceipt(name){
    await ContainerClient.getBlockBlobClien(name).download();

}

async function deleteReceipt(name){
    await ContainerClient.getBlockBlobClien(name).deleteIfExists();
}

module.exports = { uploadReceipt, downloadReceipt, deleteReceipt} ;
# Endpoints
The following endpoints are defined for the DD-CDN service:

### Endpoints

#### **GET** `/<repository>/<uuid>.extension`
 - Gets the specified resource from a given repository where:
   - `<repository>` is a valid repository name (such as `attachments`)
   - `<uuid>` is the unique identifier of the file to retrieve.

Status Codes: `200` (Successful retrieval), `404` (File not found)

---

#### **POST** `/upload`
 - Uploads the specified resource to a repository.

Sample body:
```json
{
     "repository": "attachments"
}
```

When the upload is successful, a JSON object returning the new file name is returned:
```json
{
     "fileName": "<uuid>.<extension>"
}
```

Encoding type: Urlencoded `multipart/form-data`
Please note: The file must also be specified as part of the body, and the field must be named `file`.

Status Codes: `200` (Successful upload), `400` (Bad request)

### Error handling

When a `400 Bad Request` error is thrown, the following JSON body is sent back:

```json
{
     "code": -1,
     "message": "Sample message"
}
```

The code can be used to identify the specific error that was thrown without relying on the error message alone.
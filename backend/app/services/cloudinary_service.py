import cloudinary.uploader

async def upload_image(file, folder : str):
    result = cloudinary.uploader.upload(file, folder=folder, resource_type="image")

    return {
        "url" : result.get("secure_url"),
        "public_id" : result.get("public_id")
    }

async def delete_image(public_id: str):
    result = cloudinary.uploader.destroy(public_id)
    return result
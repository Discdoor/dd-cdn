# Serving Model
DD-CDN organizes content in places known as "repositories". These repositories are defined in the main CDN configuration file.

A repository is a named storage location that has policies such as:
* File size limitations
* Max number of files per upload request
* Accepted mimetypes

A practical example would be an avatar repository with the following policies:
* 2 Megabytes max size
* 1 file per upload request
* Only allow mime-types of images and GIFs


CREATE UNIQUE INDEX permission_path_method_uniqueAdd
ON "Permission" (path, method)
WHERE "deletedAt" IS NULL;-- This is an empty migration.
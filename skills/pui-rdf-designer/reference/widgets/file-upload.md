# Widget: `file upload`

Use `"field type": "file upload"` on an item to render this widget.

Properties below are **specific to `file upload`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **10** · Combined with universal: **100**
## Identification

### `upload response`

**Default:** `bind` · **Bind data types:** `char` · **Read-only field name:** yes

Specifies a data structure response field to be returned to your program when files are uploaded populated with the number of files uploaded, the directory the files were uploaded to, and the names of each of the uploaded files. The data structure should be defined as follows:**FREE
DCL-DS UPLOADINFO QUALIFIED;
NUMFILES ZONED(3:0);
DIRECTORY CHAR(256);
FILES CHAR(256) DIM(6);
END-DS UPLOADINFO;
See also the [Upload Response](https://docs.profoundlogic.com/x/tgD7) documentation.

## Validation

### `required`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, the element cannot be empty.

## File Upload

### `selection mode`

**Default:** `standard` · **Bindable:** no

**Choices:** `standard`, `enhanced`, `single`

When set to 'enhanced' the file upload control will allow for selection of multiple files at once from the browser's file selector. This is accomplished by SHIFT+Click or CNTRL+Click or CNTRL+A. When 'standard' mode is used, the user must select each file for upload one by one. When 'single' mode is used, only one file can be chosen.

### `number of files`

**Default:** `1` · **Format:** `number` · **Bind data types:** `zoned`

This property specifies the maximum number of files that can be uploaded at one time.

### `size limit`

**Default:** `10` · **Bind data types:** `zoned`

Specifies the size limit (in MB) for each file.

### `target directory`

**Default:** `blank` · **Bind data types:** `char`, `varchar`, `string`

This property specifies the IFS directory where uploaded files will be saved.

### `rename to`

**Default:** `blank` · **Bind data types:** `char`, `varchar`, `string`

Specifies an alternate file name to be used when the uploaded file is saved.

### `overwrite files`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Specifies the action to take when 1 or more files being saved already exists in the IFS target directory. When set to 'true', any existing files will be overwritten. When set to 'false' no files will be overwritten. If "generate unique names" is set to true, then the files will be saved with automatically generated unique names. Otherwise, an error will be returned when files already exist.

### `generate unique names`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

If set to 'true' and "overwrite files" is set to 'false', then any uploaded files that already exist on the file system will be saved with automatically generated unique names.

### `allowed type`

**Default:** `[all file types]` · **Bind data types:** `char`, `varchar`, `string` · **Multi-occurrence:** yes

**Choices:** `text/plain`, `application/vnd.ms-word`, `application/vnd.ms-excel`, `application/pdf`, `image/gif`, `image/jpeg`, `image/png`, `Other...`

Specifies a MIME file type (as reported by the web browser) which is allowed to be uploaded. If not set, any file type will be allowed.

To specify multiple types, right-click the property and select Add Another Allowed Type.


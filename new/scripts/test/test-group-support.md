# Group ID Support Test Documentation

## Overview
The WhatsApp API now supports sending messages and media to both individual contacts and groups using a unified endpoint.

## New Features Added

### 1. Enhanced Contact ID Formatter
- Added `contactIdFormatter()` function that handles both phone numbers and group IDs
- Phone numbers: Automatically formatted with country code and `@s.whatsapp.net`
- Group IDs: Passed through as-is if they contain `@g.us`

### 2. Updated Endpoints
All the following endpoints now support both phone numbers and group IDs:

#### `/send-message`
- Now accepts both phone numbers (e.g., `628123456789`) and group IDs (e.g., `628986182128-1627374981@g.us`)
- Only validates phone number registration for individual contacts, not groups

#### `/send-media` 
- Now accepts both phone numbers and group IDs in the `number` field
- Supports all media input methods (file upload, base64, URL) for both individuals and groups
- Only validates phone number registration for individual contacts, not groups

#### `/is-registered`
- Enhanced to support both phone numbers and group IDs in query parameter
- Returns enhanced response with `isGroup` flag
- For groups: Returns `isRegistered: true` with valid group ID format
- For individuals: Checks actual WhatsApp registration status

## Test Cases

### Test Group Message
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "message": "Test message to group from API"
  }'
```

### Test Group Media (File Upload)
```bash
curl -X POST http://localhost:3000/send-media \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -F "number=628986182128-1627374981@g.us" \
  -F "caption=Test media to group" \
  -F "file=@/path/to/test-image.jpg"
```

### Test Group Media (Base64)
```bash
curl -X POST http://localhost:3000/send-media \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "caption": "Test base64 image to group",
    "file": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### Test Group Registration Check
```bash
curl -X GET "http://localhost:3000/is-registered?number=628986182128-1627374981@g.us" \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)"
```

Expected Response:
```json
{
  "status": true,
  "response": {
    "contactId": "628986182128-1627374981@g.us",
    "isGroup": true,
    "isRegistered": true
  }
}
```

## Implementation Details

### Key Changes Made:
1. **New Helper Function**: `contactIdFormatter()` handles both phone numbers and group IDs
2. **Conditional Validation**: Phone number registration check only applies to individual contacts (`@s.whatsapp.net`)
3. **Enhanced Responses**: Added `isGroup` flag to distinguish between individual and group contacts
4. **Unified Field Name**: All endpoints consistently use `number` field for both phone numbers and group IDs
5. **Updated Documentation**: API documentation now includes group ID examples

### Backward Compatibility:
- All existing phone number functionality remains unchanged
- Existing API calls will continue to work exactly as before
- New group ID support is additive, not breaking

## Group ID Format
Group IDs follow the format: `{phone1}-{timestamp}@g.us`
Example: `628986182128-1627374981@g.us`

Where:
- `628986182128`: Phone number of group creator
- `1627374981`: Unix timestamp when group was created
- `@g.us`: WhatsApp group domain suffix

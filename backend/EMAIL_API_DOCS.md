# Email API Documentation

## Mailjet Email Service

The email service has been updated to use **Mailjet** for sending shortlist notification emails to candidates.

## Endpoint

### POST /send-shortlist-emails

Send shortlist notification emails to selected candidates.

**Authentication Required:** Yes (Bearer token)

**Request Body:**
```json
{
  "job_id": "507f1f77bcf86cd799439011",
  "resume_ids": [
    "507f191e810c19729de860ea",
    "507f191e810c19729de860eb"
  ]
}
```

**Response:**
```json
{
  "message": "Email sending process completed",
  "sent": 2,
  "failed": 0,
  "errors": [],
  "total_requested": 2
}
```

## Email Content

### Subject
```
Congratulations! You've Been Shortlisted
```

### Email Template

The email includes:
- **Congratulations header** with gradient background
- **Personalized greeting** using candidate's name
- **Shortlist notification** with encouraging message
- **Next steps** information
- **Professional footer** with hiring team signature

### Email Features

✅ **HTML formatted** - Beautiful, professional design
✅ **Responsive** - Works on all devices
✅ **Personalized** - Uses candidate's name
✅ **Clear messaging** - Explains next steps
✅ **Professional branding** - Gradient header and styled content

## Configuration

### Environment Variables Required

```env
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
MAILJET_SENDER_EMAIL=your_verified_sender_email@example.com
```

### Mailjet Setup

1. **Create Mailjet Account**
   - Go to https://www.mailjet.com/
   - Sign up for a free account

2. **Get API Credentials**
   - Navigate to Account Settings → API Keys
   - Copy your API Key and Secret Key
   - Add them to your `.env` file

3. **Verify Sender Email**
   - Go to Account Settings → Sender Addresses
   - Add and verify your sender email address
   - Use this verified email in `MAILJET_SENDER_EMAIL`

## Usage Examples

### cURL Example

```bash
curl -X POST "http://localhost:8000/send-shortlist-emails" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "507f1f77bcf86cd799439011",
    "resume_ids": ["507f191e810c19729de860ea"]
  }'
```

### Python Example

```python
import requests

url = "http://localhost:8000/send-shortlist-emails"
headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "job_id": "507f1f77bcf86cd799439011",
    "resume_ids": [
        "507f191e810c19729de860ea",
        "507f191e810c19729de860eb"
    ]
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

### JavaScript/Fetch Example

```javascript
const response = await fetch('http://localhost:8000/send-shortlist-emails', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_id: '507f1f77bcf86cd799439011',
    resume_ids: [
      '507f191e810c19729de860ea',
      '507f191e810c19729de860eb'
    ]
  })
});

const result = await response.json();
console.log(result);
```

## Error Handling

### Common Errors

**404 - Job not found**
```json
{
  "detail": "Job not found or you don't have permission"
}
```

**400 - No resume IDs**
```json
{
  "detail": "No resume IDs provided"
}
```

**Partial Failures**
```json
{
  "message": "Email sending process completed",
  "sent": 1,
  "failed": 1,
  "errors": [
    {
      "name": "John Doe",
      "resume_id": "507f191e810c19729de860ea",
      "error": "No valid email address"
    }
  ],
  "total_requested": 2
}
```

## Email Validation

The endpoint validates:
- ✅ Job exists and belongs to current user
- ✅ Resume IDs are provided
- ✅ Candidate has a valid email address
- ✅ Email is not "Not found" or empty

## Mailjet Benefits

1. **Reliable Delivery** - High deliverability rates
2. **Free Tier** - 6,000 emails/month free
3. **Real-time Tracking** - Monitor email delivery
4. **Professional** - Better than SMTP for production
5. **Scalable** - Handles high volume easily

## Testing

### Test Email Sending

1. Create a job with resumes
2. Get the job_id and resume_ids
3. Call the endpoint with valid credentials
4. Check candidate's email inbox

### Verify Mailjet Dashboard

1. Log in to Mailjet dashboard
2. Go to Statistics → Real-time
3. See sent emails and delivery status

## Troubleshooting

### Email Not Received

1. **Check spam folder** - Emails might be filtered
2. **Verify sender email** - Must be verified in Mailjet
3. **Check Mailjet dashboard** - See delivery status
4. **Validate API keys** - Ensure they're correct in .env

### API Errors

1. **401 Unauthorized** - Check your auth token
2. **404 Not Found** - Verify job_id is correct
3. **Mailjet error** - Check API keys and sender email

### Debug Mode

Check backend logs for detailed error messages:
```bash
# View logs
tail -f backend.log

# Or check console output
python app.py
```

## Rate Limits

### Mailjet Free Tier
- 6,000 emails/month
- 200 emails/day
- No hourly limit

### Recommendations
- Batch send emails in groups
- Monitor usage in Mailjet dashboard
- Upgrade plan if needed for higher volume

## Best Practices

1. **Verify Sender** - Always use verified sender email
2. **Test First** - Send test emails before bulk sending
3. **Monitor Delivery** - Check Mailjet dashboard regularly
4. **Handle Errors** - Process failed emails appropriately
5. **Respect Privacy** - Only email shortlisted candidates

## Security

- ✅ API keys stored in environment variables
- ✅ Authentication required for endpoint
- ✅ User can only send emails for their own jobs
- ✅ Email addresses validated before sending
- ✅ Mailjet handles email security and encryption

## Support

For Mailjet-specific issues:
- Documentation: https://dev.mailjet.com/
- Support: https://www.mailjet.com/support/

For API issues:
- Check backend logs
- Verify configuration
- Test with cURL first

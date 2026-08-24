# Email Service (Resend)

## Configuration

Add the following environment variables to your `.env.local` file:

```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=your_email@yourdomain.com
```

### Getting your API Key

1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy it and add it to your `.env.local` file

### Setting up From Email

- By default, Resend uses `onboarding@resend.dev` for testing
- For production, verify your domain in Resend and use your own email address

## Usage

### Basic Email

```typescript
import { sendEmail } from '@/lib/email';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Welcome to our app!</p>',
});
```

### Multiple Recipients

```typescript
const result = await sendEmail({
  to: ['user1@example.com', 'user2@example.com'],
  subject: 'Newsletter',
  html: '<p>Check out our latest updates</p>',
});
```

### Custom From Email

```typescript
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Message content</p>',
  from: 'noreply@yourdomain.com',
});
```

### Template Email

```typescript
import { sendTemplateEmail } from '@/lib/email';

const template = `
  <h1>Welcome</h1>
  <p>Thanks for signing up!</p>
`;

const result = await sendTemplateEmail({
  to: 'user@example.com',
  subject: 'Welcome Email',
  template,
});
```

## Return Value

Both functions return an object with:

```typescript
{
  success: boolean;
  data?: any; // Resend response data
  error?: any; // Error details if failed
}
```

## Error Handling

The service automatically logs errors to the console. Always check the `success` property before proceeding:

```typescript
const result = await sendEmail({...});

if (!result.success) {
  console.error('Failed to send email:', result.error);
  // Handle error
}
```

#!/bin/bash
echo "Testing Better Auth login endpoint..."
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -v 2>&1 | grep -E "HTTP|Set-Cookie|user|error|message" | head -10

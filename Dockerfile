# Use Node.js LTS as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY client/package.json client/package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY client/ .

# Set the backend API URL before building to ensure it's embedded in the JS bundle
ENV NEXT_PUBLIC_API_URL=https://finaxial-backend.onrender.com
# Add Gemini API keys for build time
ENV NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC4WnCGFLlbUOvHao7dfK29VgzzDo8mdlk
ENV NEXT_PUBLIC_GEMINI_API_KEY_1=AIzaSyB3p-N1KKdOmus0qQKN1iM8yBbUeKV1alA
ENV NEXT_PUBLIC_GEMINI_API_KEY_2=AIzaSyCsMd7pwtiF90ufGhCOg83khTiDVPxS2IY
ENV NEXT_PUBLIC_GEMINI_API_KEY_3=AIzaSyDoY_PSXSodvwl4yzl4vQ_uhM4EvrWRrK4
ENV NEXT_PUBLIC_GEMINI_API_KEY_4=AIzaSyBMbucyXbhJ0YzhdjDAC7K9_T9RyfOaZRI
ENV NEXT_PUBLIC_GEMINI_API_KEY_5=AIzaSyAuJ3vh6WP1wz9F5ordUQ7LvbV-V5ymgOg

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
# Ensure the backend URL is available at runtime as well
ENV NEXT_PUBLIC_API_URL=https://finaxial-backend.onrender.com
# Add Gemini API keys for runtime
ENV NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC4WnCGFLlbUOvHao7dfK29VgzzDo8mdlk
ENV NEXT_PUBLIC_GEMINI_API_KEY_1=AIzaSyB3p-N1KKdOmus0qQKN1iM8yBbUeKV1alA
ENV NEXT_PUBLIC_GEMINI_API_KEY_2=AIzaSyCsMd7pwtiF90ufGhCOg83khTiDVPxS2IY
ENV NEXT_PUBLIC_GEMINI_API_KEY_3=AIzaSyDoY_PSXSodvwl4yzl4vQ_uhM4EvrWRrK4
ENV NEXT_PUBLIC_GEMINI_API_KEY_4=AIzaSyBMbucyXbhJ0YzhdjDAC7K9_T9RyfOaZRI
ENV NEXT_PUBLIC_GEMINI_API_KEY_5=AIzaSyAuJ3vh6WP1wz9F5ordUQ7LvbV-V5ymgOg

# Create a non-root user to run the app and own app files
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy only the necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Use the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]

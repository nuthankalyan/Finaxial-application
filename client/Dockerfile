# Use Node.js LTS as the base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# These values are supplied by the deployment build and embedded by Next.js.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GEMINI_API_KEY
ARG NEXT_PUBLIC_GEMINI_API_KEY_1
ARG NEXT_PUBLIC_GEMINI_API_KEY_2
ARG NEXT_PUBLIC_GEMINI_API_KEY_3
ARG NEXT_PUBLIC_GEMINI_API_KEY_4
ARG NEXT_PUBLIC_GEMINI_API_KEY_5
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY
ENV NEXT_PUBLIC_GEMINI_API_KEY_1=$NEXT_PUBLIC_GEMINI_API_KEY_1
ENV NEXT_PUBLIC_GEMINI_API_KEY_2=$NEXT_PUBLIC_GEMINI_API_KEY_2
ENV NEXT_PUBLIC_GEMINI_API_KEY_3=$NEXT_PUBLIC_GEMINI_API_KEY_3
ENV NEXT_PUBLIC_GEMINI_API_KEY_4=$NEXT_PUBLIC_GEMINI_API_KEY_4
ENV NEXT_PUBLIC_GEMINI_API_KEY_5=$NEXT_PUBLIC_GEMINI_API_KEY_5

# Build the Next.js application
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production

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

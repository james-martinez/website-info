# Website Scanner

This project is a web application that allows you to scan a website and get detailed information about it. It consists of a React frontend and a Node.js backend.

## Features

*   **Website Screenshot:** Generates a screenshot of the website.
*   **Security Analysis:** Checks for security headers (HSTS, CSP, etc.), mixed content, and other security-related information.
*   **Certificate Information:** Displays a website's SSL certificate details.
*   **DNS & WHOIS Lookup:** Retrieves DNS records (A, MX) and WHOIS information for the domain.
*   **IP Geolocation:** Provides geolocation information for the website's IP address.
*   **HTTP Transactions:** Logs and displays HTTP requests and responses.
*   **DOM Analysis:** Analyzes the DOM to provide information about scripts, links, forms, and iframes.

## Getting Started

To get a local copy up and running, you can use Docker Compose:

```sh
docker-compose up
```

This will start the frontend and backend services. You can then access the application at `http://localhost:3000`.

## Deployment

This project uses GitHub Actions to automatically build and push Docker images to the GitHub Container Registry (`ghcr.io`). The workflow is defined in `.github/workflows/build-and-push.yml`.

# Troubleshooting Guide

This document provides solutions for common issues you might encounter when setting up or running Kirra's Nail Studio.

## Installation Issues

### Error: npm install fails

**Solution:**
1. Make sure you have Node.js installed (v14 or higher)
2. Try clearing npm cache:
   ```
   npm cache clean --force
   ```
3. Try installing with the `--legacy-peer-deps` flag:
   ```
   npm install --legacy-peer-deps
   ```

### Error: Module not found

**Solution:**
1. Make sure all dependencies are installed properly:
   ```
   npm install
   ```
2. Check if the package is listed in package.json
3. Try deleting node_modules folder and reinstalling:
   ```
   rm -rf node_modules
   npm install
   ```

## Server Issues

### Error: Address already in use

**Solution:**
1. Find the process using port 3000:
   - Windows: `netstat -ano | findstr :3000`
   - Mac/Linux: `lsof -i :3000`
2. Kill the process:
   - Windows: `taskkill /PID [PID] /F`
   - Mac/Linux: `kill -9 [PID]`
3. Try starting the server again

### Error: Cannot connect to localhost:3000

**Solution:**
1. Make sure the server is running
2. Check if you have any firewall or antivirus blocking the connection
3. Try using 127.0.0.1:3000 instead of localhost:3000
4. Check server logs for any errors

## Login Issues

### Error: Verification code not working

**Solution:**
1. For testing, use the static verification code: 123456
2. Clear browser cache and cookies
3. Try using a different browser
4. Ensure JavaScript is enabled in your browser

### Error: Cannot access admin dashboard after login

**Solution:**
1. Make sure you're using the correct admin credentials (see test-credentials.js)
2. Check browser console for any JavaScript errors
3. Clear browser cache and try again
4. Check that the route is defined in server.js

## Image Gallery Issues

### Error: Images not loading in sliders

**Solution:**
1. Make sure the images exist in the public/images folder
2. Check browser console for any 404 errors
3. Verify that the server is correctly serving static files
4. Try refreshing the page

### Error: Slider animation not working

**Solution:**
1. Make sure you have the latest vertical-slider.js file
2. Check browser console for JavaScript errors
3. Verify that the CSS animations are properly defined in vertical-slider.css
4. Try a different browser to rule out browser-specific issues

## General Troubleshooting

1. Check browser console (F12) for JavaScript errors
2. Review server logs for backend errors
3. Clear browser cache and cookies
4. Try using a different browser
5. Restart the server

If you continue to experience issues not covered in this guide, please contact the development team.

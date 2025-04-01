This tool is used to automate the process of marking attendance in Ze* H*. It uses puppeteer to automate the process of logging in and marking attendance.

## Setup
1. Create a lambda function in AWS console. Set the timeout to 3 minutes and increase the memory to 512MB
2. Create a zip of index.js and node_modules.
4. Upload the zip to the lambda function.
3. Create a S3 bucket and upload the chromium driver (chromium-v122.0.0-pack.tar)
4. Now update configurations in the lambda function and add some env variables
    - `S3_CHROMIUM_URL` : S3 URL of the chromium driver
    - email : Your email
    - password : Your zen hr password
5. Add a trigger to the lambda function, you can use AWS EventBridge for scheduling the function.
6. Done! .

Bonus work:
- You can use github actions to automate the process of uploading the zip to the lambda function. You can check the .github/workflows/main.yml for reference in this repo.

# License
```
For testing and educational purposes only. Use at your own risk. I'm not responsible for any misuse of this tool.
```

# Great hamsof

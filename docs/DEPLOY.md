# Deploying Stall Tracker to AWS

One-time setup takes about 45 minutes, most of it waiting. After that, every push to `main` deploys by itself.

## How it fits together

```
Phone ──HTTPS──> CloudFront (free https://dxxxx.cloudfront.net address)
                    │  adds a secret header; only CloudFront can reach the server
                    ▼
                 EC2 t3.micro, Ubuntu 24.04, 2 GB swap
                    ├─ Caddy       checks the secret header, forwards to the app
                    ├─ Next.js app the Docker image built by GitHub Actions
                    └─ PostgreSQL  data on the encrypted disk
                          │ nightly + before every deploy
                          ▼
                       S3 bucket (encrypted backups, kept 30 days)

GitHub Actions: tests ─> build image ─> ECR ─> tells the server to deploy (via SSM)
```

Everything in AWS is created by one CloudFormation template, [deploy/aws/stack.yml](../deploy/aws/stack.yml). Deleting the stack removes it all again, except the backup bucket, which is kept on purpose.

## What it costs

Prices for Mumbai (ap-south-1), roughly, per month:

| Item                          | Cost     | Notes                                                       |
| ----------------------------- | -------- | ----------------------------------------------------------- |
| EC2 t3.micro, always on       | ~$8.20   | Covered by credits or the free tier while they last         |
| Public IPv4 address           | ~$3.65   | AWS charges for every public IPv4 address                   |
| 12 GB encrypted disk (gp3)    | ~$1.10   |                                                             |
| ECR, S3 backups, SSM, budgets | < $0.20  | Last 5 images and 30 days of small backups                  |
| CloudFront                    | $0       | Always-free allowance: 1 TB and 10 million requests a month |
| **Total**                     | **~$13** | Paid from credits first                                     |

Check what your account has under **Billing and Cost Management > Free tier** and **Credits**. The template creates a cost alert that emails you when usage passes 20% and 100% of the budget (default $5). It counts usage _before_ credits on purpose, so you hear about spending even while credits are paying.

## Before you start

- An AWS account you can log in to as an administrator.
- A GitHub account.
- In the AWS console, switch the region (top right) to **Asia Pacific (Mumbai) ap-south-1** and keep it there for every step.

## Step 1: Put the code on GitHub

Create a **private** repository on GitHub (for example `stall-tracker`), then from the `stall-tracker` folder:

```bash
git add -A
git commit -m "Stall Tracker: phases 0-2"
git remote add origin https://github.com/<you>/stall-tracker.git
git push -u origin main
```

The first push runs the tests only. The deploy job fails until steps 2 to 5 are done, which is expected.

## Step 2: Find the CloudFront prefix list ID

This list lets the server accept traffic from CloudFront and nobody else.

**VPC console > Managed prefix lists**, search for `com.amazonaws.global.cloudfront.origin-facing`, and copy its **Prefix list ID** (looks like `pl-xxxxxxxx`).

## Step 3: Make an origin secret

Any 32 or more random letters and digits. On your computer:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Keep it somewhere safe for the next step. It is not needed again after that.

## Step 4: Create the stack

1. **CloudFormation > Create stack > With new resources**.
2. **Upload a template file** and choose `deploy/aws/stack.yml`.
3. Stack name: `stall-tracker`.
4. Parameters:
   - **GitHubRepo**: `<your-github-user>/stall-tracker`
   - **CreateGitHubOidcProvider**: `true` (use `false` only if the account already has the GitHub provider; the stack fails with "already exists" if so)
   - **CloudFrontPrefixListId**: from step 2
   - **OriginSecret**: from step 3
   - **AlertEmail**: your email
   - Leave the rest as they are.
5. Next, next, tick **"I acknowledge that AWS CloudFormation might create IAM resources"**, then **Submit**.

It takes 5 to 15 minutes (CloudFront is the slow part). When the status is `CREATE_COMPLETE`, open the **Outputs** tab.

## Step 5: Connect GitHub to AWS

In the GitHub repository:

1. **Settings > Environments > New environment**, name it exactly `production`. Under **Deployment branches**, choose **Selected branches** and add `main`. (Optional: add yourself as a required reviewer to approve each deploy.)
2. **Settings > Secrets and variables > Actions > Variables > New repository variable**, add five variables from the stack Outputs:

| Variable              | Stack output       |
| --------------------- | ------------------ |
| `AWS_REGION`          | `AwsRegion`        |
| `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn`    |
| `ECR_REPOSITORY_URI`  | `EcrRepositoryUri` |
| `DEPLOY_BUCKET`       | `DeployBucket`     |
| `INSTANCE_ID`         | `InstanceId`       |

No AWS keys go into GitHub. GitHub proves which repository and environment it is, and AWS lets only that one deploy.

## Step 6: Check the server finished its setup

The server installs Docker and so on at first boot (about 5 minutes).

**EC2 > Instances > stall-tracker > Connect > Session Manager > Connect**, then:

```bash
sudo tail -3 /var/log/stall-setup.log     # should end with "Setup finished"
```

## Step 7: Deploy

GitHub **Actions > CI and deploy > Run workflow** (or push any commit to `main`). The run tests everything, builds the image, and deploys it. The deploy step prints the server's output.

## Step 8: Open it

Open the `AppUrl` output (`https://dxxxx.cloudfront.net`) on your phone and register. Then check:

```bash
curl https://dxxxx.cloudfront.net/api/health           # {"status":"ok"}
curl -m 5 http://<server-ip>/                           # times out: server is closed to everyone but CloudFront
```

The server IP is under **EC2 > Elastic IPs**.

## Everyday tasks

All of these run in a Session Manager window on the server (step 6). Start with `cd /opt/stall`.

| Task                          | Command                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| See app logs                  | `sudo docker compose logs app --tail 100`                                           |
| Find an error by its code     | `sudo docker compose logs app --since 24h \| grep <code>`                           |
| See what is running           | `sudo docker compose ps`                                                            |
| Back up now                   | `sudo bash backup.sh manual`                                                        |
| List backups / restore one    | `sudo bash restore.sh` then `sudo bash restore.sh <file-name>`                      |
| Owner forgot password and PIN | `sudo docker compose exec app node tools/scripts/reset-password.mjs <mobile> --pin` |
| When is the next backup       | `systemctl list-timers stall-backup.timer`                                          |
| Reminder job: last runs       | `journalctl -u stall-reminders --since today`                                       |
| Send due reminders now        | `sudo bash reminders.sh`                                                            |

**Going back to an older version:** in GitHub Actions, open the run of the older commit and choose **Re-run jobs**. Images for the last 5 deploys are kept. Database migrations are not undone, so every migration must keep working with the previous app version (add columns, do not rename or drop them in the same release).

## Installing on the phone and the closing reminder

- Open the `AppUrl` in Chrome (Android) or Safari (iPhone). Android shows an **Install** button on Today; on iPhone use Share, then **Add to Home Screen**.
- After the first visit with signal the app opens and works without internet: entries and closing the day are saved on the phone and sent when the signal is back.
- **Settings > Remind me at closing time** turns on a notification at closing time if the day is not closed. On iPhone this works only from the Home Screen app (iOS 16.4 or later).
- The server needs nothing extra: the first deploy creates the reminder keys in `/opt/stall/.env` and a timer checks every 5 minutes.

## Security, in short

- The server accepts web traffic only from CloudFront (security group), and Caddy also rejects anything without the secret header. There is no SSH port; Session Manager is used instead.
- The database password is generated on the server at first boot and never leaves it (`/opt/stall/.env`, readable by root only).
- The disk and backups are encrypted. The backup bucket blocks all public access and refuses non-HTTPS requests.
- Containers cannot reach the server's AWS credentials (IMDSv2 with hop limit 1).
- Security updates install automatically, with a reboot at 04:30 India time when needed.
- GitHub can only push images, upload deploy files and run the deploy command on this one server.
- Reminder notifications carry no money figures (they show on the lock screen). The reminder job can only be called from inside the server, with a secret.
- Pages kept on the phone for offline use are deleted at logout.

## Removing everything

Delete the `stall-tracker` stack in CloudFormation. The backup bucket is kept so data is never lost by accident; empty and delete it in S3 yourself if you really want it gone.

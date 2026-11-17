# Deploying Stall Tracker to AWS

One-time setup takes about 45 minutes, most of it waiting. After that, every push to `main` deploys by itself.

## How it fits together

```
Phone ──HTTPS──> CloudFront (free https://dxxxx.cloudfront.net address)
                    │  adds a secret header; only CloudFront can reach the server
                    ▼
                 EC2 t4g.micro (ARM), Ubuntu 24.04, 2 GB swap
                    ├─ Caddy       checks the secret header, forwards to the app
                    ├─ Next.js app the Docker image built by GitHub Actions
                    └─ PostgreSQL  data on the encrypted disk
                          │ nightly + before every deploy
                          ▼
                       S3 bucket (encrypted backups, kept 30 days)

GitHub Actions: tests ─> build ARM image ─> ECR ─> tells the server to deploy (via SSM)
```

The server is **ARM** (AWS Graviton). ARM servers cost about 20% less than Intel/AMD ones of the same size. The app image is built for `linux/arm64` in GitHub Actions, and the stack only allows ARM server sizes (`t4g.micro`, `t4g.small`) with the ARM Ubuntu image, so the pieces always match. Postgres, Caddy and Node all have official ARM images.

Everything in AWS is created by one CloudFormation template, [deploy/aws/stack.yml](../deploy/aws/stack.yml). Deleting the stack removes it all again, except the backup bucket, which is kept on purpose.

## What it costs

Prices for Mumbai (ap-south-1), roughly, per month:

| Item                           | Cost     | Notes                                                       |
| ------------------------------ | -------- | ----------------------------------------------------------- |
| EC2 t4g.micro (ARM), always on | ~$6.50   | Covered by credits or the free tier while they last         |
| Public IPv4 address            | ~$3.65   | AWS charges for every public IPv4 address                   |
| 12 GB encrypted disk (gp3)     | ~$1.10   |                                                             |
| ECR, S3 backups, SSM, budgets  | < $0.20  | Last 5 images and 30 days of small backups                  |
| CloudFront                     | $0       | Always-free allowance: 1 TB and 10 million requests a month |
| **Total**                      | **~$11** | Paid from credits first                                     |

`t4g.small` (2 GB memory) costs about twice as much as `t4g.micro`. AWS has run a free trial for `t4g.small` (750 hours a month) that ends on 31 December 2026. If your account shows it under **Free tier**, you can pick `t4g.small` until then, and change back to `t4g.micro` afterwards (see "Changing the server size" below).

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
   - **GitHubRepo**: `<your-github-user>/stall-tracker`, spelled exactly as in the repository's URL
   - **GitHubOwnerId** and **GitHubRepoId**: the numeric IDs of your GitHub account and repository. Open `https://api.github.com/repos/<your-github-user>/stall-tracker` in a browser (log in first if the repo is private, or use `gh api repos/<your-github-user>/stall-tracker`): **GitHubOwnerId** is `owner.id`, **GitHubRepoId** is the top-level `id`. GitHub includes both in the identity it sends to AWS, and AWS refuses the deploy if they are missing here.
   - **GitHubEnvironment**: `self-prod` (default). Must match `environment:` in [ci-deploy.yml](../.github/workflows/ci-deploy.yml) and the environment name in step 5.
   - **CreateGitHubOidcProvider**: `true` (use `false` only if the account already has the GitHub provider; the stack fails with "already exists" if so)
   - **CloudFrontPrefixListId**: from step 2
   - **OriginSecret**: from step 3
   - **AlertEmail**: your email
   - **InstanceType**: `t4g.micro` (default), or `t4g.small` for more memory
   - **AvailabilityZone**: leave blank so AWS picks one, unless you hit "Insufficient capacity" (below)
   - Leave the rest as they are. **UbuntuAmi** must stay the `arm64` image.
5. Next, next, tick **"I acknowledge that AWS CloudFormation might create IAM resources"**, then **Submit**.

It takes 5 to 15 minutes (CloudFront is the slow part). When the status is `CREATE_COMPLETE`, open the **Outputs** tab.

### If it fails with "Insufficient capacity"

This means AWS had no free server of that size in the zone it picked (Mumbai has three zones: `ap-south-1a`, `ap-south-1b`, `ap-south-1c`). It is on AWS's side, not a mistake in your setup.

1. A failed first create ends in `ROLLBACK_COMPLETE` and cannot be retried. **Delete** the stack. The backup bucket is kept on purpose; since it is empty, you can delete it in S3.
2. Create the stack again, this time setting **AvailabilityZone** to one of the zones, for example `ap-south-1b`. If that fails too, try `ap-south-1c`, then `ap-south-1a`.
3. Still failing everywhere: pick **InstanceType** `t4g.small` (a separate pool), or wait 30 to 60 minutes and try again.

## Step 5: Connect GitHub to AWS

In the GitHub repository:

1. **Settings > Environments > New environment**, name it exactly `self-prod` (the same as **GitHubEnvironment** in step 4). Under **Deployment branches**, choose **Selected branches** and add `main`. (Optional: add yourself as a required reviewer to approve each deploy.)
2. **Settings > Secrets and variables > Actions > Variables > New repository variable**, add five variables. Each one's **value** is the text in the **Value** column of the stack's Outputs tab, not the output's name:

| Variable              | Copy the Value of output | Example value                                                      |
| --------------------- | ------------------------ | ------------------------------------------------------------------ |
| `AWS_REGION`          | `AwsRegion`              | `ap-south-1`                                                       |
| `AWS_DEPLOY_ROLE_ARN` | `DeployRoleArn`          | `arn:aws:iam::123456789012:role/stall-tracker-DeployRole-AbC123`   |
| `ECR_REPOSITORY_URI`  | `EcrRepositoryUri`       | `123456789012.dkr.ecr.ap-south-1.amazonaws.com/stall-tracker-appr` |
| `DEPLOY_BUCKET`       | `DeployBucket`           | `stall-tracker-backupbucket-abc123`                                |
| `INSTANCE_ID`         | `InstanceId`             | `i-0123456789abcdef0`                                              |

No AWS keys go into GitHub. GitHub proves which repository and environment it is, and AWS lets only that one deploy.

**If the deploy fails at "configure-aws-credentials":**

- `Region is not valid: AwsRegion` (or any other output name): a variable holds the output's name instead of its value. Fix the variable as in the table above.
- `Not authorized to perform sts:AssumeRoleWithWebIdentity`: the identity GitHub sent does not match the role's trust relationship exactly. To see what GitHub sent: **CloudTrail > Event history** (region ap-south-1), filter **Event name** = `AssumeRoleWithWebIdentity`, open the newest `AccessDenied` event and read **User name**. It looks like `repo:Owner@92261105/stall-tracker@1459685435:environment:self-prod`. Compare it with **IAM > Roles > stall-tracker-DeployRole-… > Trust relationships**, the `…:sub` line. Then fix the stack parameters to match (**CloudFormation > stall-tracker > Update > Use current template**):
  - the numbers after `@` → **GitHubOwnerId** and **GitHubRepoId** (if GitHub sends no `@` numbers, leave both blank)
  - the names → **GitHubRepo**, exact upper/lower case
  - the part after `environment:` → **GitHubEnvironment**, which must also match `environment:` in `ci-deploy.yml`

3. Optional, for faster deploys: if your GitHub plan includes ARM runners, add a sixth variable `BUILD_RUNNER` with the value `ubuntu-24.04-arm`. Without it, GitHub builds the ARM image on a normal Intel/AMD runner through emulation, which works but is several times slower (expect 15 to 30 minutes for the image instead of about 5).

## Step 6: Check the server finished its setup

The server installs Docker and so on at first boot (about 5 minutes).

**EC2 > Instances > stall-tracker > Connect > Session Manager > Connect**, then:

```bash
sudo tail -3 /var/log/stall-setup.log     # should end with "Setup finished"
```

## Step 7: Deploy

GitHub **Actions > CI and deploy > Run workflow** (or push any commit to `main`). The run tests everything, builds the ARM image, and deploys it. The deploy step prints the server's output. Without `BUILD_RUNNER` (step 5), the image build is the slow part; the job is allowed 45 minutes.

If the app container keeps restarting and its log shows `exec format error`, the image was built for the wrong chip. Check that the **Build and push the image** step has `platforms: linux/arm64`.

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

## Changing the server size

Between `t4g.micro` and `t4g.small`: **CloudFormation > stall-tracker > Update > Use current template**, change **InstanceType**, and submit. AWS stops the server, resizes it and starts it again on the same disk, so data stays. The app is offline for a few minutes.

**Moving a stack that was created on an older, Intel/AMD (`t3.micro`) version of this template:** the change to ARM needs a new Ubuntu image, which means a brand new server and a brand new disk. The database on the old disk is lost with it. Do it in this order:

1. On the old server: `cd /opt/stall && sudo bash backup.sh manual` and note the file name it prints.
2. Update the stack with the new template (`t4g.micro` and the `arm64` UbuntuAmi).
3. Wait for step 6 (setup finished) on the new server, then run a deploy (step 7). The `INSTANCE_ID` output changes, so update that GitHub variable first.
4. On the new server: `cd /opt/stall && sudo bash restore.sh <file-name>`.

The backup bucket, CloudFront address and Elastic IP stay the same.

**Changing AvailabilityZone on a running stack** also replaces the server and its disk. Follow the same four steps (back up, update, deploy, restore). If the zone is changed only so that the stack can be created at all, there is no data yet and nothing to back up.

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
- `BUILD_RUNNER` only chooses which GitHub machine builds the image; it gives no extra access.
- Reminder notifications carry no money figures (they show on the lock screen). The reminder job can only be called from inside the server, with a secret.
- Pages kept on the phone for offline use are deleted at logout.

## Removing everything

Delete the `stall-tracker` stack in CloudFormation. The backup bucket is kept so data is never lost by accident; empty and delete it in S3 yourself if you really want it gone.

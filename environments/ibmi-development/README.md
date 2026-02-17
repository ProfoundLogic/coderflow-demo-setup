# Overview

This environment is for traditional IBM i / RPG application development using the [ibmi-agentic](https://github.com/ProfoundLogic/ibmi-agentic) demo repository.

## Features

- Agent can develop traditional IBM i applications and build onto a remote IBM i system via [codermake](https://www.npmjs.com/package/@profoundlogic/codermake)
- Agent can operate TN5250 interactive sessions via Profound UI / Genie to perform ad hoc exploratory tests to verify its work and get real time feedback.
- Agent can run SQL queries against IBM i via [aitool](https://www.npmjs.com/package/@profoundlogic/aitool)
- Agent produces a comprehensive summary of work done, including TN5250 screen renderings.
- Human developer can review agents' work interactively via Profound UI / Genie and give feedback.

## Agentic Coding Environment

The agentic coding envrionment consists of two layers:
- A **base environment** on IBM i that consists of one or more libraries with programs and data. The base environment is built on IBM i, periodically updated by humans, and is on the library list for all agentic coding tasks.
- A **task library** is automatically created on IBM i for each Coder task. Agents build changed sources into the task library, which is added to the top of the library list, above the base environment.

## IBM i Agentic User Profile and Libary Lists

Each Coder environment is associated with an IBM i user profile that is used by Coder tasks:
- The user profile should be **non-privileged**, and should only have the minimum authorities needed to run the application.
- The user profile should be dedicated to this purpose, i.e. only used for 1 Coder environment and nothing else.
- The base library list is inherited from the user's JOBD.

## Setup

Use these steps to set up the environment:

### 1. Build Base Environment

On IBM i, clone a copy of the [ibmi-agentic](https://github.com/ProfoundLogic/ibmi-agentic) repo and build the base environment and test data as explained in the repo's README notes. Use a new/unique library name that is dedicated to this environment.

### 2. Select and Configure Profound UI / Genie Instance

Select a Profound UI instance to use for agent exploration, screen renderings, and human testing/feedback. Make note of the instance port and installation library. Don't use an instance that is likely to be disturbed/changed by others.

- Enter the Genie URL (e.g. `https://myibmi.mycompany.com:8080/profoundui/genie`) in **Overview->Environment Information-> Screen Render URL**
- Enter the base URL (e.g. `https://myibmi.mycompany.com:8080`) in **Server->App Server->Proxy URL** and **Server-App Server->QA URL**. 

Use the fully qualified host/domain name. HTTPS is required.

These directives must be added to the PUI instance configuration `httpd.conf`:

```
SetEnv PUI_ALLOW_AGENTIC_TASK_LIB 1
SetEnv PUI_ALLOW_CODERFLOW_PROXY 1
```

### 3. Create IBM i Agentic User Profile

On IBM i, create the agentic user profile for this environment. Use a new/unique user profile that is dedicated to this environment. The examples below show user profile `XXAGENT`; replace with the chosen profile name.

Create the user profile with a command like this, filling in the unique profile name, a password, your PUI installation library, and a meaningful text description:

```
CRTUSRPRF USRPRF(XXAGENT) PASSWORD(CHOOSE_ONE) USRCLS(*USER) INLPGM(YOUR_PUI_INSTALL_LIB/PUISETENV) INLMNU(MENU) LMTCPB(*YES) TEXT('Meaningful Description') SPCAUT(*NONE) JOBD(XXAGENT/XXAGENT)
```

Create the user's home directory:

```
CRTDIR DIR('/home/xxagent')
CHGOWN OBJ('/home/xxagent') NEWOWN(XXAGENT)
QSH CMD('chmod 755 /home/xxagent')
```

Create a library named after the user profile to hold his job description:

```
CRTLIB LIB(XXAGENT) TYPE(*TEST) AUT(*EXCLUDE) TEXT('Library for XXAGENT User')
CHGOBJOWN OBJ(XXAGENT) OBJTYPE(*LIB) NEWOWN(XXAGENT)
```

Duplicate `QGPL/QDFTJOBD` into the user's library and set the library list to the base environment library you chose at step 1:

```
CRTDUPOBJ OBJ(QDFTJOBD) FROMLIB(QGPL) OBJTYPE(*JOBD) TOLIB(XXAGENT) NEWOBJ(XXAGENT)

CHGOBJOWN OBJ(XXAGENT/XXAGENT) OBJTYPE(*JOBD) NEWOWN(XXAGENT)

CHGJOBD JOBD(XXAGENT/XXAGENT) INLLIBL(YOUR_BASE_LIB QGPL QTEMP)
```

Sign on to a TN5250 session as the agentic user profile and verify that the application menu appears and the application functions normally. Correct any issues.

### 4. Set Up SSH Key Authentication for IBM i User Profile

Run these commands on the system where Coder is running. Change to this environment directory, where this README file is located. For example:

```
cd ~/coderflow-demo-setup/environments/ibmi-development
```

Then generate the key pair into this directory:

```
ssh-keygen -f ./ibmi_dev_key
```

Press enter when prompted for a passphrase to create the key without one. This will generate a private key file `imbi_key` and corresponding public key `ibmi_dev_key.pub`.

Then connect to IBM i via SSH as the agentic user and install the public key:

```
ssh-copy-id -i ./ibmi_dev_key xxagent@ibmi_host_name
```

Enter the agentic user's password when prompted to sign on and install the public key.

Then verify that you can now connect to SSH with the private key and no password:

```
ssh -i ./ibmi_dev_key xxagent@ibmi_host_name
```

### 5. Set Up Secrets

Copy the `.secrets.example.json` file to `.secrets.json` in this environment directory. This will populate the **Secrets** section with the required secrets. Replace the dummy values with real ones.

**Note:** When specifying PUI server URL, make sure to use the fully qualified PUI server base URL, e.g. `https://myibmi.mycompany.com:8080`.

### 6. Build the Environment

Build the environment using the option in the **Build** section.

## Example Task Prompts

### Hello World

```
Complete the Hello World program by outputting a message to the screen based on the user input. Add an option to the menu to launch the program.
```

### Real Programming Task w/Multiple Dependencies

```
Extend the "work with customers" program to add a new option "2=Edit". This option will call the "work with customers - detail" program in edit mode and allow the user to edit the customer and update the DB. The record should be updated when the user presses Enter.
```

### Generate New Application w/Multiple Dependencies

```
Explore the database tables to learn about the structure, then add a Work with Orders application:

The application should have a subfile list similar to the Work with Customers application.
The subfile should have a 5=Display option to view the order header.
Add an option to the menu to launch the application.
```

### Menu Modification

```
Add an option to the menu to launch the Hello World example program.
```

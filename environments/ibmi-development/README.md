# Overview

This environment is for traditional IBM i / RPG application development using the [ibmi-agentic](https://github.com/ProfoundLogic/ibmi-agentic) demo repository.

## Features

-   Agent can develop traditional IBM i applications and build onto a remote IBM i system via [codermake](https://www.npmjs.com/package/@profoundlogic/codermake)
-   Agent can operate TN5250 interactive sessions via Profound UI / Genie to perform ad hoc exploratory tests to verify its work and get real time feedback.
-   Agent can run SQL queries against IBM i via [aitool](https://www.npmjs.com/package/@profoundlogic/aitool)
-   Agent produces a comprehensive summary of work done, including TN5250 screen renderings.
-   Human developer can review agents' work interactively via Profound UI / Genie and give feedback.

## Agentic Coding Environment

The agentic coding environment consists of two layers:

-   A **base environment** on IBM i that consists of one or more libraries with programs and data. The base environment is built on IBM i, periodically updated by humans, and is on the library list for all agentic coding tasks.
-   A **task library** is automatically created on IBM i for each Coder task. Agents build changed sources into the task library, which is added to the top of the library list, above the base environment.

## IBM i Agentic User Profile and Library Lists

Each Coder environment is associated with an IBM i user profile that is used by Coder tasks:

-   The user profile should be **non-privileged**, and should only have the minimum authorities needed to run the application.
-   The user profile should be dedicated to this purpose, i.e. only used for 1 Coder environment and nothing else.
-   The base library list is inherited from the user's JOBD.

## Setup

Use these steps to set up the environment:

### 1\. Build Base Environment

On IBM i, clone a copy of the [ibmi-agentic](https://github.com/ProfoundLogic/ibmi-agentic) repo and build the base environment and test data as explained in the repo's README notes. Use a new/unique library name that is dedicated to this environment.

### 2\. Select and Configure Profound UI / Genie Instance

Select a Profound UI instance to use for agent exploration, screen renderings, and human testing/feedback. Make note of the instance port and installation library. Don't use an instance that is likely to be disturbed/changed by others.

-   Version 6.37.0 or higher is required.
-   HTTPS is required.

These directives must be added to the PUI instance configuration `httpd.conf`:

```
SetEnv PUI_ALLOW_AGENTIC_TASK_LIB 1
SetEnv PUI_ALLOW_CODERFLOW_PROXY 1
```

### 3\. Adjust IBM i Connection Details and Create IBM i User Profile  

On the **Connections** tab, there is a pre-defined IBM i connection named **dev**. Edit the connection and make these changes:

-   Change the host name to your IBM i host name.
-   Change the IBM i user profile name to the desired value. This should be a new/unique agentic coding user profile that is created for and only used with this environment.
-   Enter the desired password for the IBM i user profile.
-   Click on the **How to set up IBM i user profile** link and use the example commands to create the IBM i user profile.
    -   Make sure that the user profile's JOBD or initial program sets the appropriate base library list.
    -   Make sure that the user profile's initial program is or calls the PUISETENV program. The version of the program in the Profound UI instance installation library you selected above should be used.
-   Click **Generate Key Pair** to generate an SSH key pair for authenticating as the IBM i user profile.
-   Click **Install Public Key on Remote** to install the public key on IBM i.
-   Edit the **PUI Base URL field** and enter the Profound UI base URL for the instance you selected at step 2. For example: `https://myibmi.mycompany.com:8080`
-   Click on the **Test SQL** and **Test SSH** buttons to test the connection. Correct any problems.
-   Click **Save Connection** to save the connection, and then click **Save** at the top of the **Environment Management** page to persist the changes.
-   Sign on to a TN5250 session as the agentic user profile and verify that the application menu appears and the application functions normally. Correct any issues.

### 4\. Build the Environment

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
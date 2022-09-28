const cfg = require('./config.json')
const bluebird = require('bluebird')
const os = require('os')
const fs = bluebird.promisifyAll(require('fs'))
const child_process = bluebird.promisifyAll(require('child_process'))
const crypto = require('crypto')
const spawn = require('child_process').spawn
const docopt = require('docopt').docopt
const { Octokit } = require('@octokit/rest')
const mkdirp = require('mkdirp')
const request = require('request')
const openpgp = require('openpgp')
const username = require('username')
const readline = require('readline')
const split = require('split')
const semver = require('semver')

/**
 * Setup Custom YAML Parsing
 */
const yaml = require('js-yaml')
const PythonUnicodeType = new yaml.Type('tag:yaml.org,2002:python/unicode', {
  kind: 'scalar',
  construct: (data) => { return data !== null ? data : ''; }
})
const PYTHON_SCHEMA = new yaml.Schema({
  include: [yaml.DEFAULT_SAFE_SCHEMA],
  explicit: [PythonUnicodeType]
})

const currentUser = process.env.SUDO_USER || username.sync()

const doc = `
Usage:
  mat [options] list-upgrades [--pre-release]
  mat [options] install [--pre-release] [--version=<version>] [--mode=<mode>] [--user=<user>]
  mat [options] update
  mat [options] upgrade [--pre-release] [--mode=<mode>] [--user=<user>]
  mat [options] version
  mat [options] debug
  mat -h | --help | -v

Options:
  --dev                 Developer Mode (do not use, dangerous, bypasses checks)
  --version=<version>   Specific version install [default: latest]
  --mode=<mode>         MAT installation mode (dedicated or addon, default: dedicated)
  --user=<user>         User used for MAT configuration [default: ${currentUser}]
  --no-cache            Ignore the cache, always download the release files
  --verbose             Display verbose logging
`

const saltstackVersion = '3005'
const pubKey = `
Version: GnuPG

-----BEGIN PGP PUBLIC KEY BLOCK-----

mQENBF7DLN8BCADbBfzccuYp0xvDsK1yP+L3R+7qKR58jFGKOKUaBKdsEj/pljQ7
svtfYQfU+a9NdaDCBKud+pJ2FkO44TfkflW7RnQBcgY4HY1EZ1NX9/9yslkHQG0i
59TbXl+0gLUdhEaHWBRdJLAutp81G1vQW5jIHqCTnfqoE7ckBDxcxJNbarzdgjhQ
5CHkDZ/P43Qrdh8iFLAaOSDgHescJm477cFjKAvntJERePBInIuHpcEViETsN9Cq
BQtUW0mfnbipxnjpGcqK7ni9SDzoywXZgvEjx8Y9oONQG7lkjj+LSwd82aAi2Sc1
Nh0943FhxmPxoN9V+gHUZX3RjLAz9FiLOaaFABEBAAG0JUNvcmV5IEZvcm1hbiA8
Y29yZXlAZGlnaXRhbHNsZXV0aC5jYT6JAU4EEwEKADgWIQQukGX9vTW5a/psLU3p
lObkTPmS4wUCXsMs3wIbAwULCQgHAgYVCgkICwIEFgIDAQIeAQIXgAAKCRDplObk
TPmS46QjCAC3E+jSEc+sQge+v+XP+EY6HARLRdsd4CwVGqpnLzVNO8afmonwCMrw
6B4qJTfUtEx8CREkM7smfaDPh7NVW4nZ1Pdi1sc4CyXZdL5HJwM9NDHxxci3VAAE
Vf2dy7c6i4Rxm2HBWpfwxCRDqTyMYK8cQkh5DCftL0TW+N9s70hvf61HYlovc3Ap
4CifU8khLP7KpEHOliHRzv254taOGxFRp1ot0Fz+Zznm2KUhoLOJoo+AXooBYLDP
C7CEOR+Xn2DZzExXY9NhQnKDOie7XBU6rH3cEtAG+NZGKh1kSzRAQpeHiwViySxw
so2+C17uqb6m1MQfFVQNxaxrfM1NWH/MuQENBF7DLN8BCAC2CTY3d0ikwJbfgb9p
bup6ITK6f7mQvYo32iK+vJXlzjv05zC01PBpUJYFrBCR7lobqiie1RcwNzNp/wa1
DNxdwhQQb6ac6ZE5pgB2iMMYIzrooUdoZbQUg1Pwj2xcAosJ0iRNXN+C00gWzT48
LIBwcX8KTaRvcmjgbHJXL6jtfFycO2UYpOutwSCno5TSi7RLU0xafVq+AgAtOd0S
rHopyS47ZgxHtHkmWn11c5bY9/J1IL8C546eMoNHnelai56hclPbdDcFtHbR5HeD
1q8q/fOevhR/qpQ7SouapRi3dB/JM9SK5sVZL8/HkyFKyqMkoJHLg0JYyIlo8LRv
yKb9ABEBAAGJATYEGAEKACAWIQQukGX9vTW5a/psLU3plObkTPmS4wUCXsMs3wIb
DAAKCRDplObkTPmS44aGB/9LGDttqJYEsVCFDJcPWeGko1ly/z3QJ72F2S3ywUEH
K/Shf9n0RwMfbc/TcXhbvxRMUI6+tOKrc/WPEDAIx5u71TKaPe9JTFO29etVNmQf
mpqTc1Dj05iMrgvjW7pNV29AbuOV3jtXA0SZgcEW+UXOfO8OaQe1+Qms+eza4Knp
d/YqllH6UcAOEJ1mufv8pgkCqR2smj0badF0DH0u6ti2DS+hAYh76kPIbTGp7R+Y
M9G107FfZBXe6nDgF/KTkSMtpIFNXKmY6+/VFpUdKl3mPFA6WAHCzF7NpHa216TX
T57/PvPUNcoRFdhJQE10ULU/64yw9DtNePM0qNrldyFc
=uQiT
-----END PGP PUBLIC KEY BLOCK-----
`

const help = `

Try rebooting your system and trying the operation again.

Sometimes problems occur due to network or server issues when
downloading packages, in which case retrying your operation
a bit later might lead to good results.

To determine the nature of the issue, please review the
saltstack.log file under /var/cache/mat/cli/ in the
subdirectory that matches the MAT version you're installing.
Pay particular attention to lines that start with [ERROR], or
which come before the line "result: false".

`

let osVersion = null
let osCodename = null
let cachePath = '/var/cache/mat/cli'
let versionFile = '/etc/mat-version'
let configFile = '/etc/mat-config'
let releaseFile = '/etc/os-release'
let matConfiguration = {}

const validModes = ['dedicated','addon']
let isModeSpecified = false

const cli = docopt(doc)

const github = new Octokit({
  version: '3.0.0',
  validateCache: true,
})

const error = (err) => {
  console.log('')
  console.log(err.message)
  console.log(err.stack)
  console.log(help)
  process.exit(1)
}

const setup = async () => {
  if (cli['--dev'] === true) {
    cachePath = '/tmp/var/cache/mat'
    versionFile = '/tmp/mat-version'
    configFile = '/tmp/mat-config'
    releaseFile = '/tmp/os-release'
  }

  await mkdirp(cachePath)
}

const validOS = async () => {
  try {
    const contents = fs.readFileSync(releaseFile, 'utf8')

    if (contents.indexOf('UBUNTU_CODENAME=focal') !== -1) {
      osVersion = '20.04'
      osCodename = 'focal'
      return true
    }

    if (contents.indexOf('UBUNTU_CODENAME=jammy') !== -1) {
      osVersion = '22.04'
      osCodename = 'jammy'
      return true
    }

    throw new Error('Invalid OS or unable to determine Ubuntu version')
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw new Error('invalid OS, missing ${releaseFile}')
    }

    throw err
  }
}

const checkOptions = () => {
  if (cli['--mode'] != null) {
    if (validModes.indexOf(cli['--mode']) === -1) {
      throw new Error(`${cli['--mode']} is not a valid install mode. Valid modes are: ${validModes.join(', ')}`)
    }
    else {
      isModeSpecified = true
    }
  }
}

const fileExists = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false)
      }

      if (err) {
        return reject(err)
      }

      return resolve(true)
    })
  })
}

const saltCheckVersion = (path, value) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, contents) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false);
      }

      if (err) {
        return reject(err);
      }

      if (contents.indexOf(value) === 0) {
        return resolve(true);
      }

      return resolve(false);
    })
  })
}

const setupSalt = async () => {
  if (cli['--dev'] === false) {
    const aptSourceList = '/etc/apt/sources.list.d/saltstack.list'
    const aptDebString = `deb [signed-by=/usr/share/keyrings/salt-archive-keyring.gpg, arch=amd64] https://repo.saltproject.io/salt/py3/ubuntu/${osVersion}/amd64/${saltstackVersion} ${osCodename} main`

    const aptExists = await fileExists(aptSourceList)
    const saltExists = await fileExists('/usr/bin/salt-call')
    const saltVersionOk = await saltCheckVersion(aptSourceList, aptDebString)

    if (aptExists === true && saltVersionOk === false) {
      console.log('NOTICE: Fixing incorrect SaltStack version configuration.')
      console.log('Installing and configuring SaltStack...')
      await child_process.execAsync('apt-get remove -y --allow-change-held-packages salt-minion salt-common')
      await fs.writeFileAsync(aptSourceList, aptDebString)
      await child_process.execAsync(`wget -O /usr/share/keyrings/salt-archive-keyring.gpg https://repo.saltproject.io/salt/py3/ubuntu/${osVersion}/amd64/${saltstackVersion}/salt-archive-keyring.gpg`)
      await child_process.execAsync('apt-get update')
      await child_process.execAsync('apt-get install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y --allow-change-held-packages salt-common', {
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
        },
      })
    } else if (aptExists === false || saltExists === false) {
      console.log('Installing and configuring SaltStack...')
      await fs.writeFileAsync(aptSourceList, aptDebString)
      await child_process.execAsync(`wget -O /usr/share/keyrings/salt-archive-keyring.gpg https://repo.saltproject.io/salt/py3/ubuntu/${osVersion}/amd64/${saltstackVersion}/salt-archive-keyring.gpg`)
      await child_process.execAsync('apt-get update')
      await child_process.execAsync('apt-get install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" -y --allow-change-held-packages salt-common', {
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
        },
      })
    }
  } else {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}

const getCurrentVersion = () => {
  return fs.readFileAsync(versionFile)
    .catch((err) => {
      if (err.code === 'ENOENT') return 'notinstalled'
      if (err) throw err
    })
    .then(contents => contents.toString().replace(/\n/g, ''))
}

const listReleases = () => {
  return github.repos.listReleases({
    owner: 'digitalsleuth',
    repo: 'mat-salt'
  })
}

const getValidReleases = async () => {
  const currentRelease = await getCurrentVersion()
  let releases = await listReleases()
  const realReleases = releases.data.filter(release => !Boolean(release.prerelease)).map(release => release.tag_name)
  const allReleases = releases.data.map(release => release.tag_name)

  if (currentRelease === 'notinstalled') {
    if (cli['--pre-release'] === true) {
      return allReleases
    }
    return realReleases
  }

  let curIndex = allReleases.indexOf(currentRelease)
  if (curIndex === 0) {
    return [allReleases[0]]
  }

  if (cli['--pre-release'] === true) {
    return allReleases.slice(0, curIndex)
  }

  return allReleases.slice(0, curIndex).filter((release) => {
    return realReleases.indexOf(release) !== -1
  })
}

const getLatestRelease = () => {
  return getValidReleases().then(releases => releases[0])
}

const isValidRelease = (version) => {
  return getValidReleases().then((releases) => {
    return new Promise((resolve, reject) => {
      if (releases.indexOf(version) === -1) {
        return resolve(false)
      }
      resolve(true)
    })
  })
}

const validateVersion = (version) => {
  return getValidReleases().then((releases) => {
    if (typeof releases.indexOf(version) === -1) {
      throw new Error('The version you are attempting to install/upgrade to is not valid.')
    }
    return new Promise((resolve) => { resolve() })
  })
}

const downloadReleaseFile = (version, filename) => {
  console.log(`>> downloading ${filename}`)

  const filepath = `${cachePath}/${version}/${filename}`

  if (fs.existsSync(filepath) && cli['--no-cache'] === false) {
    return new Promise((resolve) => { resolve() })
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const req = request.get(`https://github.com/digitalsleuth/mat-salt/releases/download/${version}/${filename}`)
    req.on('error', (err) => {
      reject(err)
    })
    req
      .on('response', (res) => {
        if (res.statusCode !== 200) {
          throw new Error(res.body)
        }
      })
      .pipe(output)
      .on('error', (err) => {
        reject(err)
      })
      .on('close', resolve)
  })
}

const downloadRelease = (version) => {
  console.log(`>> downloading mat-salt-${version}.tar.gz`)

  const filepath = `${cachePath}/${version}/mat-salt-${version}.tar.gz`

  if (fs.existsSync(filepath) && cli['--no-cache'] === false) {
    return new Promise((resolve, reject) => { resolve() })
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filepath)
    const req = request.get(`https://github.com/digitalsleuth/mat-salt/archive/${version}.tar.gz`)
    req.on('error', (err) => {
      reject(err)
    })
    req
      .pipe(output)
      .on('error', (err) => {
        reject(err)
      })
      .on('close', resolve)
  })
}

const validateFile = async (version, filename) => {
  console.log(`> validating file ${filename}`)
  const expected = await fs.readFileAsync(`${cachePath}/${version}/${filename}.sha256`)

  const actual = await new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha256')
    fs.createReadStream(`${cachePath}/${version}/${filename}`)
      .on('error', (err) => {
        reject(err)
      })
      .on('data', (data) => {
        shasum.update(data)
      })
      .on('close', () => {
        resolve(`${shasum.digest('hex')}  /tmp/${filename}\n`)
      })
  })

  if (expected.toString() !== actual) {
    throw new Error(`Hashes for ${filename} do not match. Expected: ${expected}. Actual: ${actual}.`)
  }
}

const validateSignature = async (version, filename) => {
  console.log(`> validating signature for ${filename}`)

  const filepath = `${cachePath}/${version}/${filename}`

  const ctMessage = await fs.readFileAsync(`${filepath}`, 'utf8')
  const ctSignature = await fs.readFileAsync(`${filepath}.asc`, 'utf8')
  const ctPubKey = pubKey

  const options = {
    message: await openpgp.cleartext.readArmored(ctSignature),
    publicKeys: (await openpgp.key.readArmored(ctPubKey)).keys
  }

  const valid = await openpgp.verify(options)

  if (typeof valid.signatures === 'undefined' && typeof valid.signatures[0] === 'undefined') {
    throw new Error('Invalid Signature')
  }

  if (valid.signatures[0].valid === false) {
    throw new Error('PGP Signature is not valid')
  }
}

const extractUpdate = (version, filename) => {
  const filepath = `${cachePath}/${version}/${filename}`

  return new Promise((resolve, reject) => {
    console.log(`> extracting update ${filename}`)

    let stdout = ''
    let stderr = ''
    const extract = spawn('tar', ['-z', '-x', '-f', filepath, '-C', `${cachePath}/${version}`])
    extract.stdout.on('data', (data) => {
      stdout = `${stdout}${data}`
      console.log(data.toString())
    })
    extract.stderr.on('data', (data) => {
      stderr = `${stderr}${data}`
      console.log(data.toString())
    })
    extract.on('error', (err) => {
      reject(err)
    })
    extract.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error('Extraction returned exit code not zero'))
      }

      resolve()
    })
  })
}

const downloadUpdate = async (version) => {
  console.log(`> downloading ${version}`)

  await mkdirp(`${cachePath}/${version}`)
  await downloadReleaseFile(version, `mat-salt-${version}.tar.gz.asc`)
  await downloadReleaseFile(version, `mat-salt-${version}.tar.gz.sha256`)
  await downloadReleaseFile(version, `mat-salt-${version}.tar.gz.sha256.asc`)
  await downloadRelease(version)
  await validateFile(version, `mat-salt-${version}.tar.gz`)
  await validateSignature(version, `mat-salt-${version}.tar.gz.sha256`)
  await extractUpdate(version, `mat-salt-${version}.tar.gz`)
}

const performUpdate = (version) => {
  const filepath = `${cachePath}/${version}/mat-salt-${version.replace('v', '')}`
  const outputFilepath = `${cachePath}/${version}/results.yml`
  const logFilepath = `${cachePath}/${version}/saltstack.log`

  const begRegex = /Running state \[(.*)\] at time (.*)/g
  const endRegex = /Completed state \[(.*)\] at time (.*) duration_in_ms=(.*)/g

  const stateApplyMap = {
    'dedicated': 'mat.dedicated',
    'addon': 'mat.addon'
  }
 
  if (!isModeSpecified) {
    let savedMode = matConfiguration['mode']
    if (validModes.indexOf(savedMode) != -1) {
      cli['--mode'] = savedMode
	    console.log(`> using previous mode: ${cli['--mode']}`)
    }  else {
      console.log(`> no previous MAT version found; performing a new 'dedicated' installation.`)
      cli['--mode'] = "dedicated"
    }
  }

  return new Promise((resolve, reject) => {
    console.log(`> upgrading/updating to ${version}`)

    console.log(`>> Log file: ${logFilepath}`)

    if (os.platform() !== 'linux') {
      console.log(`>>> Platform is not Linux`)
      return process.exit(0)
    }

    let stdout = ''
    let stderr = ''

    const logFile = fs.createWriteStream(logFilepath)

    const updateArgs = [
      '-l', 'debug', '--local',
      '--file-root', filepath,
      '--state-output=terse',
      '--out=yaml',
      'state.apply', stateApplyMap[cli['--mode']],
      `pillar={mat_user: "${matConfiguration['user']}"}`
    ]

    const update = spawn('salt-call', updateArgs)

    update.stdout.pipe(fs.createWriteStream(outputFilepath))
    update.stdout.pipe(logFile)

    update.stderr.pipe(logFile)
    update.stderr
      .pipe(split())
      .on('data', (data) => {
        stderr = `${stderr}${data}`

        const begMatch = begRegex.exec(data)
        const endMatch = endRegex.exec(data)

        if (begMatch !== null) {
          process.stdout.write(`\n>> Running: ${begMatch[1]}\r`)
        } else if (endMatch !== null) {
          let message = `>> Completed: ${endMatch[1]} (Took: ${endMatch[3]} ms)`
          if (process.stdout.isTTY === true) {
            readline.clearLine(process.stdout, 0)
            readline.cursorTo(process.stdout, 0)
          }

          process.stdout.write(`${message}`)
        }
      })

    update.on('error', (err) => {
      console.log(arguments)

      reject(err)
    })
    update.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error('Update returned non-zero exit code'))
      }

      process.nextTick(resolve)
    })
  })
}

const summarizeResults = async (version) => {
  const outputFilepath = `${cachePath}/${version}/results.yml`
  const rawContents = await fs.readFileAsync(outputFilepath)
  let results = {}

  try {
    results = yaml.safeLoad(rawContents, { schema: PYTHON_SCHEMA })
  } catch (err) {
    // TODO handle?
  }

  let success = 0
  let failure = 0
  let failures = [];

  Object.keys(results['local']).forEach((key) => {
    if (results['local'][key]['result'] === true) {
      success++
    } else {
      failure++
      failures.push(results['local'][key])
    }
  })

  if (failure > 0) {
    console.log(`\n\n>> Incomplete due to Failures -- Success: ${success}, Failure: ${failure}`)
    console.log(`\n>>>> List of Failures (first 10 only)`)
    console.log(`\n     NOTE: First failure is generally the root cause.`)
    console.log(`\n     IMPORTANT: If seeking assistance, include this information,\n`)
    console.log(`\n     AND the /var/cache/mat/cli/${version}/saltstack.log.\n`)
    failures.sort((a, b) => {
      return a['__run_num__'] - b['__run_num__']
    }).slice(0, 10).forEach((key) => {
      console.log(`      - ID: ${key['__id__']}`)
      console.log(`        SLS: ${key['__sls__']}`)
      console.log(`        Run#: ${key['__run_num__']}`)
      console.log(`        Comment: ${key['comment']}`)
    })

    return new Promise((resolve, reject) => { return resolve() })
  }

  console.log(`\n\n>> COMPLETED SUCCESSFULLY! Success: ${success}, Failure: ${failure}`)
  console.log(`\n\n>> Please reboot to make sure all settings take effect.`)
}

const saveConfiguration = (version) => {
  const config = {
    version: version,
    mode: cli['--mode'],
    user: cli['--user']
  }

  return fs.writeFileAsync(configFile, yaml.safeDump(config))
}

const loadConfiguration = async () => {
  try {
    return await fs.readFileAsync(configFile).then((c) => yaml.safeLoad(c))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        mode: 'unknown',
        user: cli['--user']
      }
    }

    throw err
  }
}

const run = async () => {
  if (cli['-v'] === true) {
    console.log(`Version: ${cfg.version}`)
    return process.exit(0)
  }

  console.log(`> mat-cli@${cfg.version}`)

  if (cli['debug'] === true) {
    const config = await loadConfiguration()

    const debug = `
Version: ${cfg.version}
User: ${currentUser}

Config:
${yaml.safeDump(config)}
`
    console.log(debug)
    return process.exit(0)
  }

  if (currentUser === 'root') {
    console.log('Warning: You are running as root.')
    if (currentUser === cli['--user']) {
      console.log('Error: You cannot install as root without specifying the --user option.')
      console.log()
      console.log('The install user specified with --user must not be the root user.')
      return process.exit(5)
    }
  }

  checkOptions()

  await validOS()

  await setup()

  matConfiguration = await loadConfiguration()

  const version = await getCurrentVersion()
  console.log(`> mat-version: ${version}\n`)

  if (isModeSpecified) {
    console.log(`> mode: ${cli['--mode']}`)
  }

  if (cli['version'] === true) {
    return process.exit(0)
  }

  if (cli['list-upgrades'] === true) {
    const releases = await getValidReleases()
    const current = await getCurrentVersion()
    if (releases.length === 0 || releases[0] === current) {
      console.log('No upgrades available.')
      return process.exit(0)
    }

    console.log('> List of available releases')
    releases.forEach(release => console.log(`  - ${release}`))
    return process.exit(0)
  }

  if (!process.env.SUDO_USER && cli['--dev'] === false) {
    console.log('> Error! You must be root to execute this.')
    return process.exit(1)
  }

  await setupSalt()

  if (cli['update'] === true) {
    if (version === 'notinstalled') {
      throw new Error('MAT is not installed, unable to update.')
    }

    await downloadUpdate(version)
    await performUpdate(version)
    await summarizeResults(version)
  }

  if (cli['install'] === true) {
    const currentVersion = await getCurrentVersion(versionFile)

    if (currentVersion !== 'notinstalled') {
      console.log('MAT is already installed, please use the \"update\" or \"upgrade\" command.')
      return process.exit(0)
    }

    let versionToInstall = null
    if (cli['--version'] === 'latest') {
      versionToInstall = await getLatestRelease()
    } else {
      const validRelease = await isValidRelease(cli['--version'])

      if (validRelease === false) {
        console.log(`${cli['--version']} is not a MAT valid release.`)
        return process.exit(5)
      }

      versionToInstall = cli['--version']
    }

    if (versionToInstall === null) {
      throw new Error('versionToInstall was null, this should never happen.')
    }

    await validateVersion(versionToInstall)
    await downloadUpdate(versionToInstall)
    await performUpdate(versionToInstall)
    await summarizeResults(versionToInstall)
    await saveConfiguration(versionToInstall)
  }

  if (cli['upgrade'] === true) {
    const release = await getLatestRelease()
    const current = await getCurrentVersion()

    if (release === current || typeof release === 'undefined') {
      console.log('No upgrades available')
      process.exit(0)
    }

    await downloadUpdate(release)
    await performUpdate(release)
    await summarizeResults(release)
  }
}

const main = async () => {
  try {
    await run()
  } catch (err) {
    error(err)
  }
}

main()

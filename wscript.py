#! /usr/bin/python
import subprocess

def default(context):
    minify(context)


def minify(context):
    base = context.Node('./')

    print("== Minifiying ...")
    (base + 'jquery.inputs.min.js').text = compress_with_closure_compiler(
        (base + 'jquery.inputs.js').text
    ).replace('{{BUILDDATE}}', timeUTC()).replace('{{COMMITGUID}}', getCommitIDstring())


def timeUTC():
    import datetime
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M")

def getCommitIDstring():
    import subprocess

    if not subprocess.check_output:
        # let's not bother emulating it. Not important
        return ""
    else:
        return "commit ID " + subprocess.check_output(
            [
                'git'
                , 'rev-parse'
                , 'HEAD'
            ]
        ).strip()


def compress_with_closure_compiler(code, compression_level=None):
    '''Sends text of JavaScript code to Google's Closure Compiler API
    Returns text of compressed code.
    '''
    # script (with some modifications) from
    # https://developers.google.com/closure/compiler/docs/api-tutorial1

    import httplib
    import urllib

    compression_levels = [
        'WHITESPACE_ONLY'
        , 'SIMPLE_OPTIMIZATIONS'
        , 'ADVANCED_OPTIMIZATIONS'
    ]

    if compression_level not in compression_levels:
        compression_level = compression_levels[1]  # simple optimizations

    # Define the parameters for the POST request and encode them in
    # a URL-safe format.
    params = urllib.urlencode([
        ('js_code', code)
        , ('compilation_level', compression_level)
        , ('output_format', 'json')
        , ('output_info', 'compiled_code')
        , ('output_info', 'warnings')
        , ('output_info', 'errors')
        , ('output_info', 'statistics')
        # , ('output_file_name', 'default.js')
        # , ('js_externs', 'javascript with externs') # only used on Advanced.
      ])

    # Always use the following value for the Content-type header.
    headers = {"Content-type": "application/x-www-form-urlencoded"}
    conn = httplib.HTTPConnection('closure-compiler.appspot.com')
    conn.request('POST', '/compile', params, headers)
    response = conn.getresponse()

    if response.status != 200:
        raise Exception("Compilation server responded with non-OK status of " + str(response.status))

    compressedcode = response.read()
    conn.close()

    import json  # needs python 2.6+ or simplejson module for earlier
    parts = json.loads(compressedcode)

    if 'errors' in parts:
        prettyerrors = ['\nCompilation Error:']
        for error in parts['errors']:
            prettyerrors.append(
                "\nln %s, ch %s, '%s' - %s" % (
                    error['lineno']
                    , error['charno']
                    , error['line']
                    , error['error']
                )
            )
        raise Exception(''.join(prettyerrors))

    return parts['compiledCode']


def run_command(command, working_dir):
    subprocess.call(
        command
        , shell=True
        , cwd=working_dir
    )


if __name__ == '__main__':
    print("This is a Wak build automation tool script. Please, get Wak on GitHub and run it against the folder containing this automation script.")

import subprocess

# List of Python scripts to run
scripts = [
    "network_metrics_collector.py",
    "services_health_collector.py",
    "system_metrics_collector.py",
    "instances_simulator.py"
]

# List to hold subprocesses
processes = []

try:
    # Start each script as a subprocess
    for script in scripts:
        print(f"Starting {script}...")
        process = subprocess.Popen(["python3", script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        processes.append((script, process))
    
    print("All scripts are running. Press Ctrl+C to stop.")

    # Wait for all subprocesses to finish (block until terminated)
    for script, process in processes:
        stdout, stderr = process.communicate()
        print(f"Output from {script}:\n{stdout.decode()}")
        if stderr:
            print(f"Errors from {script}:\n{stderr.decode()}")

except KeyboardInterrupt:
    print("\nTerminating all scripts...")
    for script, process in processes:
        process.terminate()
        print(f"Terminated {script}.")

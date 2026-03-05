from kubernetes import client, config

config.load_kube_config()

apps = client.AppsV1Api()

def scale_workers(replicas):

    body = {
        "spec": {
            "replicas": replicas
        }
    }

    apps.patch_namespaced_deployment_scale(
        name="python-worker",
        namespace="default",
        body=body
    )
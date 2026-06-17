"""Minimal upload handler — stores request body in S3 and returns JSON."""

import json
import os
import uuid

import boto3


def main(event, context):
    bucket = os.environ.get("BUCKET_NAME", "")
    body = event.get("body") or ""
    key = f"uploads/{uuid.uuid4().hex}.json"

    client = boto3.client("s3")
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=body.encode("utf-8"),
        ContentType="application/json",
    )

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"bucket": bucket, "key": key, "status": "stored"}),
    }

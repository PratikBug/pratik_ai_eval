export const D1_TASK_SLUG = "tasks/d1-terraform-plan-for-a-small-service";

export const D1_ARTIFACT_PATHS = {
  validate: `${D1_TASK_SLUG}/artifacts/terraform-validate.txt`,
  plan: `${D1_TASK_SLUG}/artifacts/terraform-plan.txt`,
} as const;

export const D1_VERIFY_CMD = `bash ${D1_TASK_SLUG}/scripts/verify.sh`;

export const D1_STACK_COMPONENTS = [
  "aws_s3_bucket (versioned app data)",
  "aws_lambda_function (Python 3.11 upload handler)",
  "aws_api_gateway_rest_api (POST /upload)",
  "aws_iam_role + S3 policy",
  "LocalStack emulator (localhost:4566)",
] as const;

export interface D1VerifyResponse {
  output: string;
  exitCode: number;
  validateOutput?: string;
  planOutput?: string;
}

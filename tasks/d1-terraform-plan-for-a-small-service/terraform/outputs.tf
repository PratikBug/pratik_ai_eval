output "s3_bucket_name" {
  description = "Name of the S3 bucket for uploaded payloads."
  value       = aws_s3_bucket.app_data.bucket
}

output "lambda_function_name" {
  description = "Deployed Lambda function name."
  value       = aws_lambda_function.api_handler.function_name
}

output "api_gateway_invoke_url" {
  description = "Base invoke URL for the upload endpoint."
  value       = "${aws_api_gateway_stage.local.invoke_url}/upload"
}

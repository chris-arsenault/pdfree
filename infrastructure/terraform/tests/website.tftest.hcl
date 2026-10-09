mock_provider "aws" {
  override_during = plan
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "559098897826"
      arn        = "arn:aws:iam::559098897826:role/synthetic-test"
      user_id    = "synthetic-test"
    }
  }
  mock_data "aws_route53_zone" {
    defaults = { zone_id = "ZPDFREESYNTHETIC", name = "ahara.io." }
  }
}

override_resource {
  target          = module.website.aws_acm_certificate.this
  override_during = plan
  values = {
    arn = "arn:aws:acm:us-east-1:559098897826:certificate/00000000-0000-0000-0000-000000000000"
    domain_validation_options = [{
      domain_name           = "pdf.ahara.io"
      resource_record_name  = "_synthetic.pdf.ahara.io"
      resource_record_type  = "CNAME"
      resource_record_value = "synthetic.acm-validations.aws."
    }]
  }
}

run "static_editor" {
  command = plan
  assert {
    condition     = fileexists("${path.module}/../../frontend/dist/ocr/lang/eng.traineddata.gz")
    error_message = "Build the complete frontend including compressed OCR language data before checking hosting."
  }
  assert {
    condition     = module.website.hostname == "pdf.ahara.io"
    error_message = "Hosting must use the PDFree hostname."
  }
  assert {
    condition     = one(aws_s3_bucket_server_side_encryption_configuration.assets.rule).apply_server_side_encryption_by_default[0].sse_algorithm == "AES256"
    error_message = "Assets must use S3-managed encryption without a new KMS key."
  }
}
